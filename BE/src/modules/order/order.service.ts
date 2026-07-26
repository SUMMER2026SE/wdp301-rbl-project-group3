import { Types } from 'mongoose';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IOrder, Order, OrderStatus } from '../../models/order.model';
import { TrackingStatus } from '../../models/deliveryTracking.model';
import { inventoryRepository } from '../inventory/inventory.repository';
import { emitToRoom, emitGlobal } from '../../config/socket.config';
import { orderRepository } from './order.repository';
import { cartRepository } from '../cart/cart.repository';
import { promotionValidationService } from '../promotion/services/validation.service';
import { promotionCalculationService } from '../promotion/services/calculation.service';
import { promotionUsageService } from '../promotion/services/usage.service';
import { invoiceRepository } from '../invoice/invoice.repository';
import { User } from '../../models/user.model';
import { Branch } from '../../models/branch.model';
import { systemSettingRepository } from '../system-setting/system-setting.repository';
import { flashSaleRepository } from '../flash-sale/flash-sale.repository';
import { sendOrderRefundEmail } from '../../utils/mail.util';
import {
  BackOfficeActor,
  assertBackOfficeBranchAccess,
  resolveBackOfficeBranch,
} from '../../utils/backOfficeAccess.util';
import { payOSClient } from '../../config/payos.config';
import { env } from '../../config/env.config';

/**
 * Order state machine. Keeping legal next states in one table prevents route
 * handlers from accidentally bypassing the fulfilment workflow.
 */
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['delivering', 'cancelled'],
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
};

/**
 * Coordinates order lifecycle operations across inventory, promotions,
 * payments, invoices, delivery tracking, and real-time notifications.
 */
export class OrderService {
  /** Resolves scoped back-office filters and returns a paginated order list. */
  async getOrders(
    filters: { branchId?: string; status?: string; keyword?: string; startDate?: string; endDate?: string; page?: number; limit?: number },
    actor: BackOfficeActor
  ): Promise<{ orders: IOrder[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const branchId = await resolveBackOfficeBranch(actor, filters.branchId);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { orders, total } = await orderRepository.findPaginated(
      { ...filters, branchId },
      page,
      limit
    );
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /** Loads one order and enforces branch access when the caller is staff. */
  async getOrderById(id: string, actor?: BackOfficeActor): Promise<IOrder> {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError('Order not found', 404);
    if (actor) {
      await assertBackOfficeBranchAccess(actor, this.getObjectIdString(order.branchId));
    }
    return order;
  }

  /**
   * Confirms a pending order while reserving stock. Stock is reconciled if the
   * conditional status write fails, avoiding an orphaned stock deduction.
   */
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
    this.emitOrderUpdate(updated);
    return updated;
  }

  /**
   * Applies a legal staff-driven status transition and executes its side
   * effects, including inventory, tracking, refunds, loyalty, and sockets.
   */
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

    if (status === 'cancelled') {
      await this.restoreFlashSaleQuantities(order);
    }
    await this.recordTrackingEvent(
      id,
      status as TrackingStatus,
      actor.userId,
      `Order status changed from ${order.status} to ${status}`
    );

    // Tích điểm tích lũy cho khách hàng khi giao hàng thành công & thanh toán thành công
    if (status === 'delivered') {
      if (updated.paymentStatus !== 'paid') {
        updated.paymentStatus = 'paid';
        await updated.save();
      }
      await this.awardLoyaltyPointsIfEligible(updated);
    }

    this.emitOrderUpdate(updated);
    return updated;
  }

  /** Deducts every aggregated line item; rolls back prior deductions on error. */
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

        emitGlobal('inventory:updated', {
          branchId,
          productId,
          quantity: result.inventory.quantity,
        });

      } catch (error) {
        await this.increaseOrderStock(order, staffId, false);
        throw error;
      }
    }
  }

  /** Restores prior stock deductions and compensates if a restoration fails. */
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
        emitGlobal('inventory:updated', {
          branchId,
          productId,
          quantity: result.inventory.quantity,
        });
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

  /** Restores the persisted order's stock state after a failed status mutation. */
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

  /** Merges duplicate product lines so inventory is adjusted exactly once per SKU. */
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

  /** Normalizes populated and unpopulated Mongoose identifiers into strings. */
  private getObjectIdString(value: unknown): string {
    if (value instanceof Types.ObjectId) return value.toString();
    if (value && typeof value === 'object' && '_id' in value) {
      return String((value as { _id: { toString(): string } })._id);
    }
    return String(value);
  }

  /** Creates an auditable delivery-tracking event for a completed transition. */
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

  /** Blocks cancellation once an invoice has been issued for the order. */
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

  /** Shapes an order into the safe, customer-facing response contract. */
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
      paymentStatus: order.paymentStatus ?? 'pending',
      payosOrderCode: order.payosOrderCode ?? null,
      note: order.note ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /** Returns only the authenticated customer's historical orders. */
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

    // Tự động kiểm tra và cập nhật trạng thái đơn hàng PayOS chưa thanh toán với máy chủ PayOS
    for (const order of orders) {
      if (order.paymentMethod === 'payos' && order.paymentStatus !== 'paid' && order.payosOrderCode && payOSClient) {
        try {
          const info = await payOSClient.paymentRequests.get(order.payosOrderCode);
          if (info && info.status === 'PAID') {
            order.paymentStatus = 'paid';
            if (order.status === 'pending') {
              order.status = 'confirmed';
              order.confirmedAt = new Date();
            }
            await order.save();
            await orderRepository.addTrackingEvent(
              order._id.toString(),
              'confirmed',
              order.customerId.toString(),
              'Thanh toán thành công qua cổng PayOS.'
            );
            this.emitOrderUpdate(order);
          }
        } catch (e) {
          // ignore
        }
      }
    }

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

  /** Retrieves tracking information after proving customer ownership. */
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
    return this.syncPayOSStatus(orderId, customerId);
  }

  /** Lets a customer cancel only an eligible order and restores reservations. */
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
    await this.restoreFlashSaleQuantities(order);
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
    this.emitOrderUpdate(updatedOrder);
    return this.buildCustomerOrderResponse(updatedOrder);
  }

  /** Cancels unpaid overdue orders from the scheduled timeout job. */
  async autoCancelOverdueOrder(orderId: string, timeoutMinutes: number): Promise<void> {
    const order = await orderRepository.findRawById(orderId);
    if (!order || order.status !== 'pending' || order.paymentStatus === 'paid') return;

    await this.increaseOrderStock(order, 'system', false);
    await this.restoreFlashSaleQuantities(order);

    const updatedOrder = await orderRepository.updateStatusIfCurrent(orderId, 'pending', {
      status: 'cancelled',
    });

    if (!updatedOrder) {
      await this.reconcileOrderStock(order, 'system');
      return;
    }

    await this.recordTrackingEvent(
      orderId,
      'cancelled',
      'system',
      `Tự động hủy đơn hàng do vượt quá thời gian chờ (${timeoutMinutes} phút).`
    );

    this.emitOrderUpdate(updatedOrder);
  }

  /** Produces a human-readable, timestamp-based order reference. */
  private generateOrderCode(): string {
    const date = new Date();
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${stamp}-${random}`;
  }

  /**
   * Validates checkout input, calculates promotions and totals, persists the
   * order, then creates the payment flow required by the chosen method.
   */
  async placeOrder(customerId: string, data: {
    branchId: string;
    shippingAddress: string;
    phoneNumber: string;
    note?: string;
    paymentMethod: 'COD' | 'payos';
    voucherCode?: string;
  }): Promise<any> {
    // 0.5. Kiểm tra chi nhánh và giờ mở cửa / đóng cửa
    const branch = await Branch.findById(data.branchId).exec();
    if (!branch || branch.status === 'inactive') {
      throw new AppError('Chi nhánh được chọn hiện đang tạm ngưng hoạt động.', 400);
    }

    const now = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = daysOfWeek[now.getDay()];

    if (branch.activeDays && branch.activeDays.length > 0 && !branch.activeDays.includes(currentDayName)) {
      throw new AppError(
        `Chi nhánh ${branch.name} không hoạt động vào ngày ${currentDayName}. Vui lòng chọn chi nhánh khác!`,
        400
      );
    }

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    const openTime = branch.openingTime || '08:00';
    const closeTime = branch.closingTime || '22:00';

    if (currentTimeStr < openTime || currentTimeStr >= closeTime) {
      throw new AppError(
        `Chi nhánh ${branch.name} hiện đã đóng cửa (Giờ hoạt động: ${openTime} - ${closeTime}). Vui lòng quay lại trong khung giờ mở cửa!`,
        400
      );
    }

    // 1. Lấy giỏ hàng của user
    const cart = await cartRepository.findByUserId(customerId);
    if (!cart || cart.items.length === 0) {
      throw new AppError('Giỏ hàng trống, không thể đặt hàng.', 400);
    }

    // Lấy chiến dịch Flash Sale đang hoạt động của chi nhánh này
    const activeFlashSale = await flashSaleRepository.findActiveFlashSale(data.branchId);
    const flashSaleIncrements: { flashSaleId: string; productId: string; quantity: number }[] = [];

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

      // Check if product is in the active flash sale and limit quantity is not exceeded
      let unitPrice = product.salePrice ?? 0;

      let isFlashSaleApplied = false;

      if (activeFlashSale) {
        const flashProduct = activeFlashSale.products.find(
          (p) => this.getObjectIdString(p.productId) === this.getObjectIdString(product._id)
        );
        if (
          flashProduct &&
          flashProduct.soldQuantity + item.quantity <= flashProduct.limitQuantity
        ) {
          unitPrice = flashProduct.flashSalePrice;
          isFlashSaleApplied = true;
        }
      }

      const subtotal = unitPrice * item.quantity;
      totalAmountBeforeDiscount += subtotal;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });

      if (isFlashSaleApplied && activeFlashSale) {
        flashSaleIncrements.push({
          flashSaleId: activeFlashSale._id.toString(),
          productId: product._id.toString(),
          quantity: item.quantity,
        });
      }
    }

    // 2.5. Kiểm tra giá trị đơn hàng tối thiểu
    const minOrderSetting = await systemSettingRepository.findByKey('min_order_amount');
    const minOrderVal = Number(minOrderSetting?.value ?? 0);
    if (totalAmountBeforeDiscount < minOrderVal) {
      throw new AppError(
        `Giá trị đơn hàng tối thiểu phải từ ${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(minOrderVal)} trở lên.`,
        400
      );
    }

    // 3. Xử lý voucher nếu có
    let discountAmount = 0;
    let appliedVoucherId: string | undefined;

    if (data.voucherCode) {
      const voucher = await promotionValidationService.validateVoucher(
        data.voucherCode,
        totalAmountBeforeDiscount,
        data.branchId
      );
      discountAmount = promotionCalculationService.calculateDiscount(voucher, totalAmountBeforeDiscount);
      appliedVoucherId = voucher._id.toString();
    }

    // 3.5. Tính toán phí vận chuyển (Shipping fee) và VAT từ system settings
    const [freeShippingThresholdSetting, defaultDeliveryFeeSetting, vatRateSetting] = await Promise.all([
      systemSettingRepository.findByKey('free_shipping_threshold'),
      systemSettingRepository.findByKey('default_delivery_fee'),
      systemSettingRepository.findByKey('vat_rate')
    ]);
    const threshold = Number(freeShippingThresholdSetting?.value ?? 200000);
    const fee = Number(defaultDeliveryFeeSetting?.value ?? 15000);
    const vatRate = Number(vatRateSetting?.value ?? 10);
    const shippingFee = totalAmountBeforeDiscount >= threshold ? 0 : fee;

    const amountAfterDiscount = Math.max(0, totalAmountBeforeDiscount - discountAmount);
    const vatAmount = Math.round(amountAfterDiscount * (vatRate / 100));

    const totalAmount = amountAfterDiscount + vatAmount + shippingFee;

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

    // Cập nhật số lượng đã bán trong Flash Sale
    for (const inc of flashSaleIncrements) {
      await flashSaleRepository.incrementProductSoldQuantity(
        inc.flashSaleId,
        inc.productId,
        inc.quantity
      );
    }

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

    let payOSData: any = null;
    if (data.paymentMethod === 'payos') {
      try {
        if (payOSClient) {
          const numericCode = Number(Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900));
          order.payosOrderCode = numericCode;
          await order.save();
          const paymentLink = await payOSClient.paymentRequests.create({
            orderCode: numericCode,
            amount: Math.round(totalAmount),
            description: `PMAN ${orderCode.slice(-8)}`.substring(0, 25),
            cancelUrl: `${env.clientUrl}/dashboard/orders?payos_cancel=true&orderId=${order._id.toString()}`,
            returnUrl: `${env.clientUrl}/dashboard/orders?payos_success=true&orderId=${order._id.toString()}`,
          });
          payOSData = {
            checkoutUrl: paymentLink.checkoutUrl,
            qrCode: paymentLink.qrCode,
            accountName: paymentLink.accountName,
            accountNumber: paymentLink.accountNumber,
            bin: paymentLink.bin,
          };
        } else {
          // VietQR PayOS QR fallback mode for instant scanning
          const memo = `PMAN ${orderCode.slice(-8)}`;
          payOSData = {
            checkoutUrl: null,
            qrCode: `https://img.vietqr.io/image/MB-0388888888-compact2.png?amount=${Math.round(totalAmount)}&addInfo=${encodeURIComponent(memo)}&accountName=PMAN%20MART`,
            accountName: 'PMAN MART (PayOS Gate)',
            accountNumber: '0388888888',
            bin: '970422',
            memo,
          };
        }
      } catch (payosErr) {
        console.error('[PAYOS_CREATE_PAYMENT_LINK_FAILED]', payosErr);
      }
    }

    const orderResponse: any = this.buildCustomerOrderResponse(order);
    if (payOSData) {
      orderResponse.payOSData = payOSData;
    }

    // Phát tin realtime cho chi nhánh được chọn và cho toàn bộ Admin/Staff
    emitToRoom(`branch:${data.branchId}`, 'order:new', orderResponse);
    emitToRoom('role:admin', 'order:created', orderResponse);
    emitToRoom('role:branch_manager', 'order:created', orderResponse);

    return orderResponse;
  }

  /** Processes a verified PayOS callback and idempotently updates payment state. */
  async handlePayOSWebhook(webhookData: any): Promise<any> {
    try {
      let verifiedData: any = webhookData;
      if (payOSClient && payOSClient.webhooks) {
        try {
          verifiedData = await payOSClient.webhooks.verify(webhookData);
        } catch (vErr) {
          console.warn('[PAYOS_WEBHOOK_VERIFY_WARN]', vErr);
        }
      }

      const dataObj = verifiedData.data || verifiedData;
      if (dataObj && (verifiedData.code === '00' || verifiedData.success === true || dataObj.code === '00')) {
        const orderCodeStr = dataObj.orderCode?.toString();
        let order: any = await Order.findOne({
          $or: [
            { code: { $regex: orderCodeStr || 'NOMATCH', $options: 'i' } },
            { code: dataObj.orderCode }
          ]
        }).exec();

        if (!order) {
          order = await Order.findOne({ paymentMethod: 'payos', paymentStatus: { $ne: 'paid' } }).sort({ createdAt: -1 }).exec();
        }

        if (order) {
          order.paymentStatus = 'paid';
          if (order.status === 'pending') {
            order.status = 'confirmed';
            order.confirmedAt = new Date();
          }
          await order.save();

          await orderRepository.addTrackingEvent(
            order._id.toString(),
            'confirmed',
            order.customerId.toString(),
            'Thanh toán thành công qua cổng PayOS.'
          );

          await this.awardLoyaltyPointsIfEligible(order);
          this.emitOrderUpdate(order);
        }
      }
      return { success: true };
    } catch (err) {
      console.error('[PAYOS_WEBHOOK_ERROR]', err);
      return { success: false };
    }
  }

  /** Queries PayOS to reconcile a payment whose callback may be delayed. */
  async syncPayOSStatus(orderId: string, customerId?: string): Promise<any> {
    const order: any = customerId
      ? await orderRepository.findByIdAndCustomerId(orderId, customerId)
      : await orderRepository.findById(orderId);

    if (!order) throw new AppError('Order not found', 404);

    if (order.paymentMethod === 'payos' && order.paymentStatus !== 'paid' && payOSClient) {
      try {
        let paymentLinkInfo: any = null;
        if (order.payosOrderCode) {
          paymentLinkInfo = await payOSClient.paymentRequests.get(order.payosOrderCode);
        }

        if (paymentLinkInfo && paymentLinkInfo.status === 'PAID') {
          order.paymentStatus = 'paid';
          if (order.status === 'pending') {
            order.status = 'confirmed';
            order.confirmedAt = new Date();
          }
          await order.save();

          await orderRepository.addTrackingEvent(
            order._id.toString(),
            'confirmed',
            order.customerId.toString(),
            'Thanh toán thành công qua cổng PayOS.'
          );

          await this.awardLoyaltyPointsIfEligible(order);
          this.emitOrderUpdate(order);
        }
      } catch (payosErr) {
        console.error('[PAYOS_SYNC_STATUS_FAILED]', payosErr);
      }
    }

    return this.buildCustomerOrderResponse(order);
  }

  /** Converts an optional actor reference into a stable tracking payload. */
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

  /** Returns flash-sale allocations when a confirmed order is cancelled. */
  private async restoreFlashSaleQuantities(order: IOrder): Promise<void> {
    try {
      const orderDate = order.createdAt;
      const branchId = this.getObjectIdString(order.branchId);

      for (const item of order.items) {
        const productId = this.getObjectIdString(item.productId);
        const flashSale = await flashSaleRepository.findFlashSaleByOrderProduct(
          orderDate,
          branchId,
          productId
        );

        if (flashSale) {
          await flashSaleRepository.decrementProductSoldQuantity(
            flashSale._id.toString(),
            productId,
            item.quantity
          );
        }
      }
    } catch (err) {
      console.error('[RESTORE_FLASH_SALE_QUANTITIES_FAILED]', err);
    }
  }
  /** Awards loyalty points once for paid, successfully delivered orders. */
  private async awardLoyaltyPointsIfEligible(order: IOrder): Promise<void> {
    if (!order || !order.customerId) return;
    // Điểm thưởng CHỈ được cộng khi: Đơn hàng đã giao thành công (status = 'delivered') VÀ đã thanh toán thành công (paymentStatus = 'paid')
    if (order.status !== 'delivered' || order.paymentStatus !== 'paid') return;
    if (order.isPointsAwarded) return;

    try {
      const [ptsPer10kSetting, bronze, silver, gold, diamond] = await Promise.all([
        systemSettingRepository.findByKey('loyalty_points_per_10k'),
        systemSettingRepository.findByKey('loyalty_bronze_threshold'),
        systemSettingRepository.findByKey('loyalty_silver_threshold'),
        systemSettingRepository.findByKey('loyalty_gold_threshold'),
        systemSettingRepository.findByKey('loyalty_diamond_threshold'),
      ]);

      const ptsPer10k = Number(ptsPer10kSetting?.value ?? 1);
      const rate = ptsPer10k > 0 ? ptsPer10k : 1;
      const pointsEarned = Math.floor(order.totalAmount / 10000) * rate;

      if (pointsEarned > 0) {
        const user = await User.findById(order.customerId).exec();
        if (user) {
          user.points = (user.points || 0) + pointsEarned;
          user.lifetimePoints = (user.lifetimePoints || 0) + pointsEarned;

          const bronzeMin = Number(bronze?.value ?? 100);
          const silverMin = Number(silver?.value ?? 300);
          const goldMin = Number(gold?.value ?? 600);
          const diamondMin = Number(diamond?.value ?? 1000);

          const lp = user.lifetimePoints;
          let newLevel: 'new' | 'bronze' | 'silver' | 'gold' | 'diamond' = 'new';
          if (lp >= diamondMin) {
            newLevel = 'diamond';
          } else if (lp >= goldMin) {
            newLevel = 'gold';
          } else if (lp >= silverMin) {
            newLevel = 'silver';
          } else if (lp >= bronzeMin) {
            newLevel = 'bronze';
          }

          user.memberLevel = newLevel;
          await user.save();

          order.isPointsAwarded = true;
          await order.save();

          emitToRoom(`customer:${user._id.toString()}`, 'user:points_updated', {
            points: user.points,
            lifetimePoints: user.lifetimePoints,
            memberLevel: user.memberLevel,
          });
        }
      }
    } catch (err) {
      console.error('[LOYALTY_POINTS_AWARD_FAILED]', err);
    }
  }

  /** Broadcasts an order change to the relevant branch and customer rooms. */
  private emitOrderUpdate(order: any) {
    const customerId = this.getObjectIdString(order.customerId);
    const branchId = this.getObjectIdString(order.branchId);
    const orderResponse = this.buildCustomerOrderResponse(order);

    emitToRoom(`customer:${customerId}`, 'order:status_updated', orderResponse);
    emitToRoom(`branch:${branchId}`, 'order:updated', orderResponse);
    emitToRoom('role:admin', 'order:updated', orderResponse);
    emitToRoom('role:branch_manager', 'order:updated', orderResponse);
  }
}

export const orderService = new OrderService();
