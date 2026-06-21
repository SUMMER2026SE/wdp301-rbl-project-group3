import { Types } from 'mongoose';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IOrder, OrderStatus } from '../../models/order.model';
import { inventoryRepository } from '../inventory/inventory.repository';
import { orderRepository } from './order.repository';

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
}

export const orderService = new OrderService();
