import { Types } from 'mongoose';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IOrder, Order, OrderStatus } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { inventoryRepository } from '../inventory/inventory.repository';
import { orderRepository } from './order.repository';
import { cartRepository } from '../cart/cart.repository';
import { promotionValidationService } from '../promotion/services/validation.service';
import { promotionCalculationService } from '../promotion/services/calculation.service';
import { promotionUsageService } from '../promotion/services/usage.service';

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['pending', 'preparing', 'cancelled'],
  preparing: ['confirmed', 'delivering', 'cancelled'],
  delivering: ['preparing', 'delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export class OrderService {
  async getOrders(filters: { branchId?: string; status?: string }): Promise<IOrder[]> {
    return orderRepository.findAll(filters);
  }

  async getOrderById(id: string): Promise<IOrder> {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async confirmOrder(id: string, staffId: string): Promise<IOrder> {
    const order = await this.getOrderById(id);
    if (order.status !== 'pending') {
      throw new AppError('Only pending orders can be confirmed', 400);
    }

    await this.ensureStockAvailable(order);
    await this.decreaseOrderStock(order, staffId);

    let updated: IOrder | null;
    try {
      updated = await orderRepository.updateStatusIfCurrent(id, order.status, {
        status: 'confirmed',
        confirmedBy: staffId,
        confirmedAt: new Date(),
      });
    } catch (error) {
      await this.increaseOrderStock(order, staffId);
      throw error;
    }

    if (!updated) {
      await this.increaseOrderStock(order, staffId);
      throw new AppError('Order status changed by another request. Please reload and try again.', 409);
    }
    return updated;
  }

  async updateStatus(id: string, status: OrderStatus, staffId: string): Promise<IOrder> {
    const order = await this.getOrderById(id);
    const nextStatuses = allowedTransitions[order.status];

    if (!nextStatuses.includes(status)) {
      throw new AppError(`Cannot change order status from ${order.status} to ${status}`, 400);
    }

    const update: {
      status: OrderStatus;
      confirmedBy?: string;
      confirmedAt?: Date;
    } = { status };

    let stockDecreased = false;
    let stockIncreased = false;

    const isProcessingState = (s: OrderStatus) => ['confirmed', 'preparing', 'delivering'].includes(s);

    // If moving from pending to a processing state, decrease stock
    if (order.status === 'pending' && isProcessingState(status)) {
      await this.ensureStockAvailable(order);
      await this.decreaseOrderStock(order, staffId);
      stockDecreased = true;
      if (status === 'confirmed') {
        update.confirmedBy = staffId;
        update.confirmedAt = new Date();
      }
    }

    // If moving from a processing state back to pending or to cancelled, increase/restore stock
    if (isProcessingState(order.status) && (status === 'pending' || status === 'cancelled')) {
      await this.increaseOrderStock(order, staffId);
      stockIncreased = true;
    }

    let updated: IOrder | null;
    try {
      updated = await orderRepository.updateStatusIfCurrent(id, order.status, update);
    } catch (error) {
      await this.rollbackStockChange(order, staffId, stockDecreased, stockIncreased);
      throw error;
    }

    if (!updated) {
      await this.rollbackStockChange(order, staffId, stockDecreased, stockIncreased);
      throw new AppError('Order status changed by another request. Please reload and try again.', 409);
    }
    return updated;
  }

  private async ensureStockAvailable(order: IOrder): Promise<void> {
    const branchId = this.getObjectIdString(order.branchId);

    for (const item of order.items) {
      const productId = this.getObjectIdString(item.productId);
      const stock = await inventoryRepository.findInventoryItem(
        branchId,
        productId
      );

      if (!stock || stock.quantity < item.quantity) {
        throw new AppError(`Insufficient stock for product ${productId}`, 400);
      }
    }
  }

  private async decreaseOrderStock(order: IOrder, staffId: string): Promise<void> {
    const branchId = this.getObjectIdString(order.branchId);
    const decreasedItems: { productId: string; quantity: number }[] = [];

    for (const item of order.items) {
      const productId = this.getObjectIdString(item.productId);

      try {
        const updated = await inventoryRepository.decreaseStock({
          branchId,
          productId,
          quantity: item.quantity,
          updatedBy: staffId,
        });

        if (!updated) {
          throw new AppError(`Insufficient stock for product ${productId}`, 400);
        }

        decreasedItems.push({ productId, quantity: item.quantity });
      } catch (error) {
        await this.restoreDecreasedStock(branchId, decreasedItems, staffId);
        throw error;
      }
    }
  }

  private async restoreDecreasedStock(
    branchId: string,
    items: { productId: string; quantity: number }[],
    staffId: string
  ): Promise<void> {
    for (const item of items) {
      await inventoryRepository.increaseStock({
        branchId,
        productId: item.productId,
        quantity: item.quantity,
        updatedBy: staffId,
      });
    }
  }

  private async increaseOrderStock(order: IOrder, staffId: string): Promise<void> {
    const branchId = this.getObjectIdString(order.branchId);

    for (const item of order.items) {
      const productId = this.getObjectIdString(item.productId);
      const updated = await inventoryRepository.increaseStock({
        branchId,
        productId,
        quantity: item.quantity,
        updatedBy: staffId,
      });

      if (!updated) {
        throw new AppError(`Inventory record not found for product ${productId}`, 404);
      }
    }
  }

  private async rollbackStockChange(
    order: IOrder,
    staffId: string,
    stockDecreased: boolean,
    stockIncreased: boolean
  ): Promise<void> {
    if (stockDecreased) {
      await this.increaseOrderStock(order, staffId);
    }

    if (stockIncreased) {
      await this.decreaseOrderStock(order, staffId);
    }
  }

  private getObjectIdString(value: unknown): string {
    if (value instanceof Types.ObjectId) return value.toString();
    if (value && typeof value === 'object' && '_id' in value) {
      return String((value as { _id: { toString(): string } })._id);
    }
    return String(value);
  }

  private buildCustomerOrderResponse(order: IOrder) {
    const branch = order.branchId as any;
    return {
      orderId: order._id.toString(),
      code: order.code,
      status: order.status,
      branch: branch?._id
        ? {
          branchId: branch._id.toString(),
          name: branch.name,
          code: branch.code,
          address: branch.address,
          phone: branch.phone ?? null,
        }
        : { branchId: String(order.branchId) },
      items: order.items.map((item: any) => {
        const product = item.productId;
        return {
          productId: product?._id?.toString() ?? String(item.productId ?? ''),
          productName: product?.name ?? '',
          sku: product?.sku ?? '',
          unit: product?.unit ?? '',
          imageUrl: product?.imageUrl ?? null,
          quantity: item.quantity ?? 0,
          unitPrice: item.unitPrice ?? 0,
          subtotal: item.subtotal ?? 0,
        };
      }),
      totalAmount: order.totalAmount,
      deliveryAddress: order.deliveryAddress ?? null,
      note: order.note ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async getOrderHistory(
    customerId: string,
    page: number,
    limit: number,
    status?: OrderStatus
  ) {
    const validStatuses: OrderStatus[] = [
      'pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled',
    ];
    if (status && !validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Valid values: ${validStatuses.join(', ')}`, 400);
    }

    const { orders, total } = await orderRepository.findByCustomerId(
      customerId, page, limit, status
    );
    const totalPages = Math.ceil(total / limit);

    return {
      orders: orders.map((o) => this.buildCustomerOrderResponse(o)),
      pagination: {
        total, page, limit, totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async trackOrder(orderId: string, customerId: string) {
    const order = await orderRepository.findByIdAndCustomerId(orderId, customerId);
    if (!order) throw new AppError('Order not found', 404);

    const trackingEvents = await orderRepository.findTrackingByOrderId(orderId);

    return {
      order: this.buildCustomerOrderResponse(order),
      tracking: trackingEvents.map((e) => ({
        trackingId: e._id.toString(),
        status: e.status,
        location: e.location ?? null,
        note: e.note ?? null,
        timestamp: e.createdAt,
      })),
      currentStatus: order.status,
    };
  }

  async getCustomerOrderById(orderId: string, customerId: string) {
    const order = await orderRepository.findByIdAndCustomerId(orderId, customerId);
    if (!order) throw new AppError('Order not found', 404);
    return this.buildCustomerOrderResponse(order);
  }

  async cancelCustomerOrder(orderId: string, customerId: string, reason?: string) {
    const order = await orderRepository.findByIdAndCustomerId(orderId, customerId);
    if (!order) throw new AppError('Order not found', 404);

    if (order.status !== 'pending') {
      throw new AppError(
        `Cannot cancel order with status "${order.status}". Only pending orders can be cancelled.`,
        409
      );
    }

    const [updatedOrder] = await Promise.all([
      orderRepository.cancelByCustomer(orderId),
      orderRepository.addTrackingEvent(
        orderId,
        'cancelled',
        reason ?? 'Cancelled by customer'
      ),
    ]);

    if (!updatedOrder) throw new AppError('Failed to cancel order', 500);
    return this.buildCustomerOrderResponse(updatedOrder);
  }

  private generateOrderCode(): string {
    const date = new Date();
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${stamp}-${random}`;
  }

  async placeOrder(customerId: string, data: {
    branchId: string;
    shippingAddress: string;
    phoneNumber: string;
    note?: string;
    paymentMethod: 'COD' | 'banking' | 'momo' | 'vnpay';
    voucherCode?: string;
  }): Promise<any> {
    // 1. Lấy giỏ hàng của user
    const cart = await cartRepository.findByUserId(customerId);
    if (!cart || cart.items.length === 0) {
      throw new AppError('Giỏ hàng trống, không thể đặt hàng.', 400);
    }

    // 2. Kiểm tra tồn kho và lấy thông tin sản phẩm
    const orderItems: any[] = [];
    let totalAmountBeforeDiscount = 0;

    for (const item of cart.items) {
      const product = item.productId as any; // populated product
      if (!product || product.status === 'inactive') {
        throw new AppError(`Sản phẩm ${product?.name || 'không xác định'} không còn bán.`, 400);
      }

      // Check stock
      const stock = await inventoryRepository.findInventoryItem(
        data.branchId,
        product._id.toString()
      );
      if (!stock || stock.quantity < item.quantity) {
        throw new AppError(
          `Sản phẩm ${product.name} không đủ tồn kho tại chi nhánh đã chọn (Chỉ còn ${stock?.quantity ?? 0} sản phẩm).`,
          400
        );
      }

      const unitPrice = product.salePrice ?? 0;
      const subtotal = unitPrice * item.quantity;
      totalAmountBeforeDiscount += subtotal;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });
    }

    // 3. Xử lý voucher nếu có
    let totalAmount = totalAmountBeforeDiscount;
    let discountAmount = 0;
    let appliedVoucherId: string | undefined;

    if (data.voucherCode) {
      const voucher = await promotionValidationService.validateVoucher(
        data.voucherCode,
        totalAmountBeforeDiscount,
        data.branchId
      );
      discountAmount = promotionCalculationService.calculateDiscount(voucher, totalAmountBeforeDiscount);
      totalAmount = Math.max(0, totalAmountBeforeDiscount - discountAmount);
      appliedVoucherId = voucher._id.toString();
    }

    // 4. Tạo mã đơn hàng
    const orderCode = this.generateOrderCode();

    // 5. Lưu order vào database
    const order = await Order.create({
      code: orderCode,
      customerId: new Types.ObjectId(customerId),
      branchId: new Types.ObjectId(data.branchId),
      items: orderItems,
      totalAmount,
      status: 'pending',
      deliveryAddress: data.shippingAddress,
      note: data.note,
    });

    // 6. Gắn tracking event ban đầu
    await orderRepository.addTrackingEvent(
      order._id.toString(),
      'order_placed',
      'Đơn hàng được đặt thành công.'
    );

    // 7. Áp dụng voucher (cập nhật trạng thái voucher và promotion usageCount)
    if (appliedVoucherId) {
      await promotionUsageService.applyVoucher(appliedVoucherId, customerId, order._id.toString());
    }

    // 8. Xóa sạch giỏ hàng
    await cartRepository.clearCart(customerId);

    return this.buildCustomerOrderResponse(order);
  }
}

export const orderService = new OrderService();
