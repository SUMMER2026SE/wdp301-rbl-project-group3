import { Types } from 'mongoose';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IOrder, Order, OrderStatus } from '../../models/order.model';
import { TrackingStatus } from '../../models/deliveryTracking.model';
import { inventoryRepository } from '../inventory/inventory.repository';
import { orderRepository } from './order.repository';
import { cartRepository } from '../cart/cart.repository';
import { promotionValidationService } from '../promotion/services/validation.service';
import { promotionCalculationService } from '../promotion/services/calculation.service';
import { promotionUsageService } from '../promotion/services/usage.service';
import { invoiceRepository } from '../invoice/invoice.repository';
import {
  BackOfficeActor,
  assertBackOfficeBranchAccess,
  resolveBackOfficeBranch,
} from '../../utils/backOfficeAccess.util';

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['delivering', 'cancelled'],
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
};

export class OrderService {
  async getOrders(
    filters: { branchId?: string; status?: string },
    actor: BackOfficeActor
  ): Promise<IOrder[]> {
    const branchId = await resolveBackOfficeBranch(actor, filters.branchId);
    return orderRepository.findAll({ ...filters, branchId });
  }

  async getOrderById(id: string, actor?: BackOfficeActor): Promise<IOrder> {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    if (actor) {
      await assertBackOfficeBranchAccess(actor, this.getObjectIdString(order.branchId));
    }
    return order;
  }

  async confirmOrder(id: string, actor: BackOfficeActor): Promise<IOrder> {
    const order = await this.getOrderById(id, actor);
    if (order.status !== 'pending') {
      throw new AppError('Only pending orders can be confirmed', 400);
    }

    await this.decreaseOrderStock(order, actor.userId);

    let updated: IOrder | null;
    try {
      updated = await orderRepository.updateStatusIfCurrent(id, order.status, {
        status: 'confirmed',
        confirmedBy: actor.userId,
        confirmedAt: new Date(),
      });
    } catch (error) {
      await this.reconcileOrderStock(order, actor.userId);
      throw error;
    }

    if (!updated) {
      await this.reconcileOrderStock(order, actor.userId);
      throw new AppError('Order status changed by another request. Please reload and try again.', 409);
    }
    await this.recordTrackingEvent(
      id,
      'confirmed',
      actor.userId,
      'Order confirmed by back-office staff'
    );
    return updated;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    actor: BackOfficeActor
  ): Promise<IOrder> {
    const order = await this.getOrderById(id, actor);
    const nextStatuses = allowedTransitions[order.status];

    if (!nextStatuses.includes(status)) {
      throw new AppError(`Cannot change order status from ${order.status} to ${status}`, 400);
    }
    if (status === 'cancelled') {
      await this.ensureNoIssuedInvoice(id);
    }

    const update: {
      status: OrderStatus;
      confirmedBy?: string;
      confirmedAt?: Date;
    } = { status };

    const isProcessingState = (s: OrderStatus) => ['confirmed', 'preparing', 'delivering'].includes(s);

    // If moving from pending to a processing state, decrease stock
    if (order.status === 'pending' && isProcessingState(status)) {
      await this.decreaseOrderStock(order, actor.userId);
      if (status === 'confirmed') {
        update.confirmedBy = actor.userId;
        update.confirmedAt = new Date();
      }
    }

    // If moving from a processing state back to pending or to cancelled, increase/restore stock
    if (isProcessingState(order.status) && (status === 'pending' || status === 'cancelled')) {
      await this.increaseOrderStock(order, actor.userId, true);
    }

    let updated: IOrder | null;
    try {
      updated = await orderRepository.updateStatusIfCurrent(id, order.status, update);
    } catch (error) {
      await this.reconcileOrderStock(order, actor.userId);
      throw error;
    }

    if (!updated) {
      await this.reconcileOrderStock(order, actor.userId);
      throw new AppError('Order status changed by another request. Please reload and try again.', 409);
    }
    await this.recordTrackingEvent(
      id,
      status as TrackingStatus,
      actor.userId,
      `Order status changed from ${order.status} to ${status}`
    );
    return updated;
  }

  private async decreaseOrderStock(order: IOrder, staffId: string): Promise<void> {
    const branchId = this.getObjectIdString(order.branchId);

    for (const item of this.aggregateOrderItems(order)) {
      const productId = item.productId;

      try {
        const result = await inventoryRepository.applyOrderStockDeduction({
          orderId: order._id.toString(),
          branchId,
          productId,
          quantity: item.quantity,
          updatedBy: staffId,
        });

        if (!result.inventory) {
          throw new AppError(`Insufficient stock for product ${productId}`, 400);
        }

      } catch (error) {
        await this.increaseOrderStock(order, staffId, false);
        throw error;
      }
    }
  }

  private async increaseOrderStock(
    order: IOrder,
    staffId: string,
    allowLegacy: boolean
  ): Promise<void> {
    const branchId = this.getObjectIdString(order.branchId);
    const restoredItems: { productId: string; quantity: number }[] = [];

    for (const item of this.aggregateOrderItems(order)) {
      const productId = item.productId;

      try {
        const result = await inventoryRepository.restoreOrderStockDeduction({
          orderId: order._id.toString(),
          branchId,
          productId,
          quantity: item.quantity,
          updatedBy: staffId,
          allowLegacy,
        });

        if (!result.inventory) {
          throw new AppError(`Inventory record not found for product ${productId}`, 404);
        }
        if (result.restored) {
          restoredItems.push({ productId, quantity: item.quantity });
        }
      } catch (error) {
        for (const restored of restoredItems.reverse()) {
          await inventoryRepository.applyOrderStockDeduction({
            orderId: order._id.toString(),
            branchId,
            productId: restored.productId,
            quantity: restored.quantity,
            updatedBy: staffId,
          });
        }
        throw error;
      }
    }
  }

  private async reconcileOrderStock(
    order: IOrder,
    staffId: string
  ): Promise<void> {
    const current = await orderRepository.findRawById(order._id.toString());
    if (!current) return;
    const shouldBeDeducted = [
      'confirmed',
      'preparing',
      'delivering',
      'delivered',
    ].includes(current.status);
    if (shouldBeDeducted) {
      await this.decreaseOrderStock(order, staffId);
    } else {
      await this.increaseOrderStock(order, staffId, false);
    }
  }

  private aggregateOrderItems(
    order: IOrder
  ): { productId: string; quantity: number }[] {
    const quantities = new Map<string, number>();
    for (const item of order.items) {
      const productId = this.getObjectIdString(item.productId);
      quantities.set(productId, (quantities.get(productId) || 0) + item.quantity);
    }
    return [...quantities.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private getObjectIdString(value: unknown): string {
    if (value instanceof Types.ObjectId) return value.toString();
    if (value && typeof value === 'object' && '_id' in value) {
      return String((value as { _id: { toString(): string } })._id);
    }
    return String(value);
  }

  private async recordTrackingEvent(
    orderId: string,
    status: TrackingStatus,
    changedBy: string,
    note: string
  ): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await orderRepository.addTrackingEvent(orderId, status, changedBy, note);
        return;
      } catch (error) {
        lastError = error;
      }
    }
    console.error('[ORDER_TRACKING_WRITE_FAILED]', {
      orderId,
      status,
      error: lastError,
    });
  }

  private async ensureNoIssuedInvoice(orderId: string): Promise<void> {
    const invoice = await invoiceRepository.findByOrderId(orderId);
    if (invoice) {
      throw new AppError(
        'This order already has an issued invoice and cannot be cancelled. Use the return workflow after fulfillment.',
        409
      );
    }
    await invoiceRepository.releaseStaleOrderInvoiceReservation(orderId);
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
      phoneNumber: order.phoneNumber ?? null,
      paymentMethod: order.paymentMethod ?? 'COD',
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
        changedBy: this.buildTrackingActor(e.changedBy),
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

    await this.increaseOrderStock(order, customerId, false);
    const updatedOrder = await orderRepository.cancelByCustomer(orderId, customerId);
    if (!updatedOrder) {
      await this.reconcileOrderStock(order, customerId);
      throw new AppError('Order status changed and can no longer be cancelled', 409);
    }
    await this.recordTrackingEvent(
      orderId,
      'cancelled',
      customerId,
      reason ?? 'Cancelled by customer'
    );
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
      phoneNumber: data.phoneNumber,
      paymentMethod: data.paymentMethod,
      note: data.note,
    });

    // 6. Gắn tracking event ban đầu
    await orderRepository.addTrackingEvent(
      order._id.toString(),
      'order_placed',
      customerId,
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

  private buildTrackingActor(value: unknown) {
    if (value && typeof value === 'object' && '_id' in value) {
      const actor = value as {
        _id: Types.ObjectId;
        fullName?: string;
        email?: string;
        role?: string;
      };
      return {
        userId: actor._id.toString(),
        fullName: actor.fullName ?? null,
        email: actor.email ?? null,
        role: actor.role ?? null,
      };
    }
    return value ? { userId: String(value) } : null;
  }
}

export const orderService = new OrderService();
