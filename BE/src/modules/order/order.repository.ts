import { Types } from 'mongoose';
import { IOrder, Order, OrderStatus } from '../../models/order.model';
import { DeliveryTracking, IDeliveryTracking, TrackingStatus } from '../../models/deliveryTracking.model';

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

  async findByCustomerId(
    customerId: string,
    page: number,
    limit: number,
    status?: OrderStatus
  ): Promise<{ orders: IOrder[]; total: number }> {
    const filter: Record<string, unknown> = {
      customerId: new Types.ObjectId(customerId),
    };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('branchId', 'name code address')
        .populate('items.productId', 'name sku unit imageUrl')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      Order.countDocuments(filter),
    ]);

    return { orders, total };
  }

  async findByIdAndCustomerId(
    orderId: string,
    customerId: string
  ): Promise<IOrder | null> {
    return Order.findOne({
      _id: new Types.ObjectId(orderId),
      customerId: new Types.ObjectId(customerId),
    })
      .populate('branchId', 'name code address phone')
      .populate('items.productId', 'name sku unit imageUrl')
      .exec();
  }


  async cancelByCustomer(orderId: string): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(
      orderId,
      { $set: { status: 'cancelled' } },
      { returnDocument: 'after' }
    )
      .populate('branchId', 'name code address')
      .populate('items.productId', 'name sku unit')
      .exec();
  }

  async findTrackingByOrderId(orderId: string): Promise<IDeliveryTracking[]> {
    return DeliveryTracking.find({ orderId: new Types.ObjectId(orderId) })
      .sort({ createdAt: 1 })
      .exec();
  }

  async addTrackingEvent(
    orderId: string,
    status: TrackingStatus,
    note?: string,
    location?: string
  ): Promise<IDeliveryTracking> {
    return DeliveryTracking.create({
      orderId: new Types.ObjectId(orderId),
      status,
      note,
      location,
    });
  }

}

export const orderRepository = new OrderRepository();
