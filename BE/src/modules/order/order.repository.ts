import { IOrder, Order, OrderStatus } from '../../models/order.model';

export class OrderRepository {
  async findAll(filters: { branchId?: string; status?: string }): Promise<IOrder[]> {
    const query: Record<string, unknown> = {};

    if (filters.branchId) query.branchId = filters.branchId;
    if (filters.status) query.status = filters.status;

    return Order.find(query)
      .populate('customerId', 'fullName email phone')
      .populate('branchId', 'name code address')
      .populate('items.productId', 'name sku unit')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<IOrder | null> {
    return Order.findById(id)
      .populate('customerId', 'fullName email phone')
      .populate('branchId', 'name code address')
      .populate('items.productId', 'name sku unit')
      .exec();
  }

  async updateStatus(id: string, data: {
    status: OrderStatus;
    confirmedBy?: string;
    confirmedAt?: Date;
  }): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(id, data, { new: true })
      .populate('customerId', 'fullName email phone')
      .populate('branchId', 'name code address')
      .populate('items.productId', 'name sku unit')
      .exec();
  }

  async updateStatusIfCurrent(id: string, currentStatus: OrderStatus, data: {
    status: OrderStatus;
    confirmedBy?: string;
    confirmedAt?: Date;
  }): Promise<IOrder | null> {
    return Order.findOneAndUpdate(
      { _id: id, status: currentStatus },
      data,
      { new: true }
    )
      .populate('customerId', 'fullName email phone')
      .populate('branchId', 'name code address')
      .populate('items.productId', 'name sku unit')
      .exec();
  }
}

export const orderRepository = new OrderRepository();
