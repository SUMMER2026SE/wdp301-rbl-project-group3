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
}

export const orderService = new OrderService();
