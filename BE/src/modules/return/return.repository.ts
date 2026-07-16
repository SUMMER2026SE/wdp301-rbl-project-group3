import { Types } from 'mongoose';
import { IOrder, Order } from '../../models/order.model';
import {
  IReturnItem,
  IReturnRequest,
  ReturnRequest,
  ReturnStatus,
} from '../../models/returnRequest.model';

export class ReturnRepository {
  async findOrder(orderId: string): Promise<IOrder | null> {
    return Order.findById(orderId)
      .populate('customerId', 'fullName email phone')
      .populate('branchId', 'name code address')
      .populate('items.productId', 'name sku unit')
      .exec();
  }

  async acquireOrderLock(orderId: string, lockId: string): Promise<IOrder | null> {
    const staleAt = new Date(Date.now() - 5 * 60 * 1000);
    return Order.findOneAndUpdate(
      {
        _id: orderId,
        status: 'delivered',
        $or: [
          { returnMutationLockedAt: { $exists: false } },
          { returnMutationLockedAt: { $lt: staleAt } },
        ],
      },
      {
        $set: {
          returnMutationLockedAt: new Date(),
          returnMutationLockId: lockId,
        },
      },
      { new: true }
    ).exec();
  }

  async releaseOrderLock(orderId: string, lockId: string): Promise<void> {
    await Order.updateOne(
      { _id: orderId, returnMutationLockId: lockId },
      {
        $unset: {
          returnMutationLockedAt: 1,
          returnMutationLockId: 1,
        },
      }
    ).exec();
  }

  async findPaginated(
    filters: {
      branchId?: string;
      orderId?: string;
      customerId?: string;
      status?: string;
    },
    page: number,
    limit: number
  ) {
    const query: Record<string, unknown> = {};
    if (filters.branchId) query.branchId = new Types.ObjectId(filters.branchId);
    if (filters.orderId) query.orderId = new Types.ObjectId(filters.orderId);
    if (filters.customerId) query.customerId = new Types.ObjectId(filters.customerId);
    if (filters.status) query.status = filters.status;

    const [returns, total] = await Promise.all([
      ReturnRequest.find(query)
        .populate('orderId', 'code status')
        .populate('customerId', 'fullName email phone')
        .populate('branchId', 'name code address')
        .populate('createdBy', 'fullName email')
        .populate('reviewedBy', 'fullName email')
        .populate('completedBy', 'fullName email')
        .populate('refundedBy', 'fullName email')
        .populate('cancelledBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ReturnRequest.countDocuments(query).exec(),
    ]);

    return {
      returns,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<IReturnRequest | null> {
    return ReturnRequest.findById(id)
      .populate('orderId', 'code status')
      .populate('customerId', 'fullName email phone')
      .populate('branchId', 'name code address')
      .populate('createdBy', 'fullName email')
      .populate('reviewedBy', 'fullName email')
      .populate('completedBy', 'fullName email')
      .populate('refundedBy', 'fullName email')
      .populate('cancelledBy', 'fullName email')
      .exec();
  }

  async findRawById(id: string): Promise<IReturnRequest | null> {
    return ReturnRequest.findById(id).exec();
  }

  async getReservedSummary(
    orderId: string,
    excludeReturnId?: string
  ): Promise<Map<string, { quantity: number; refundAmount: number }>> {
    const query: Record<string, unknown> = {
      orderId: new Types.ObjectId(orderId),
      status: { $in: ['pending', 'approved', 'completing', 'completed'] },
    };
    if (excludeReturnId) query._id = { $ne: new Types.ObjectId(excludeReturnId) };

    const returns = await ReturnRequest.find(query).select('items').lean().exec();
    const reserved = new Map<
      string,
      { quantity: number; refundAmount: number }
    >();
    for (const request of returns) {
      for (const item of request.items) {
        const key = item.productId.toString();
        const current = reserved.get(key) || { quantity: 0, refundAmount: 0 };
        reserved.set(key, {
          quantity: current.quantity + item.quantity,
          refundAmount: current.refundAmount + (item.refundAmount || 0),
        });
      }
    }
    return reserved;
  }

  async create(data: {
    code: string;
    orderId: string;
    orderCode: string;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    branchId: string;
    branchName: string;
    branchAddress: string;
    items: IReturnItem[];
    reason: string;
    totalRefund: number;
    createdBy: string;
  }): Promise<IReturnRequest> {
    return new ReturnRequest(data).save();
  }

  async updatePending(
    id: string,
    data: { reason: string; items: IReturnItem[]; totalRefund: number }
  ): Promise<IReturnRequest | null> {
    return ReturnRequest.findOneAndUpdate(
      { _id: id, status: 'pending' },
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async updateStatus(
    id: string,
    expectedStatus: ReturnStatus | ReturnStatus[],
    data: Record<string, unknown>
  ): Promise<IReturnRequest | null> {
    const statusCondition = Array.isArray(expectedStatus)
      ? { $in: expectedStatus }
      : expectedStatus;
    return ReturnRequest.findOneAndUpdate(
      { _id: id, status: statusCondition },
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async acquireForCompletion(
    id: string,
    lockId: string
  ): Promise<IReturnRequest | null> {
    const staleAt = new Date(Date.now() - 5 * 60 * 1000);
    return ReturnRequest.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { status: 'approved' },
          {
            status: 'completing',
            completionLockedAt: { $lt: staleAt },
          },
        ],
      },
      {
        $set: {
          status: 'completing',
          completionLockId: lockId,
          completionLockedAt: new Date(),
        },
      },
      { new: true }
    ).exec();
  }

  async renewCompletionLock(id: string, lockId: string): Promise<boolean> {
    const result = await ReturnRequest.updateOne(
      { _id: id, status: 'completing', completionLockId: lockId },
      { $set: { completionLockedAt: new Date() } }
    ).exec();
    return result.matchedCount === 1;
  }

  async renewOrderLock(orderId: string, lockId: string): Promise<boolean> {
    const result = await Order.updateOne(
      { _id: orderId, returnMutationLockId: lockId },
      { $set: { returnMutationLockedAt: new Date() } }
    ).exec();
    return result.matchedCount === 1;
  }

  async completeWithLock(
    id: string,
    lockId: string,
    data: Record<string, unknown>
  ): Promise<IReturnRequest | null> {
    return ReturnRequest.findOneAndUpdate(
      { _id: id, status: 'completing', completionLockId: lockId },
      {
        $set: data,
        $unset: {
          completionLockId: 1,
          completionLockedAt: 1,
        },
      },
      { new: true, runValidators: true }
    ).exec();
  }

  async releaseCompletion(id: string, lockId: string): Promise<void> {
    await ReturnRequest.updateOne(
      { _id: id, status: 'completing', completionLockId: lockId },
      {
        $set: { status: 'approved' },
        $unset: {
          completionLockId: 1,
          completionLockedAt: 1,
        },
      }
    ).exec();
  }
}

export const returnRepository = new ReturnRepository();
