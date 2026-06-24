import { Types } from 'mongoose';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IOrder } from '../../models/order.model';
import {
  IReturnItem,
  IReturnRequest,
  RefundMethod,
  ReturnItemCondition,
} from '../../models/returnRequest.model';
import {
  BackOfficeActor,
  assertBackOfficeBranchAccess,
  resolveBackOfficeBranch,
} from '../../utils/backOfficeAccess.util';
import { inventoryRepository } from '../inventory/inventory.repository';
import { returnRepository } from './return.repository';

type ReturnItemInput = {
  productId: string;
  quantity: number;
  condition: ReturnItemCondition;
};

export class ReturnService {
  async listReturns(
    filters: {
      page: number;
      limit: number;
      branchId?: string;
      orderId?: string;
      customerId?: string;
      status?: string;
    },
    actor: BackOfficeActor
  ) {
    const branchId = await resolveBackOfficeBranch(actor, filters.branchId);
    const result = await returnRepository.findPaginated(
      { ...filters, branchId },
      filters.page,
      filters.limit
    );
    return {
      returns: result.returns,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  async getReturn(id: string, actor: BackOfficeActor): Promise<IReturnRequest> {
    const request = await returnRepository.findById(id);
    if (!request) throw new AppError('Return request not found', 404);
    await assertBackOfficeBranchAccess(actor, this.objectId(request.branchId));
    return request;
  }

  async createReturn(
    data: { orderId: string; reason: string; items: ReturnItemInput[] },
    actor: BackOfficeActor
  ): Promise<IReturnRequest> {
    const order = await this.getDeliveredOrder(data.orderId, actor);
    const lockId = new Types.ObjectId().toString();
    await this.acquireOrderLock(data.orderId, lockId);

    try {
      const items = await this.prepareItems(order, data.items);
      await this.ensureReturnQuantitiesAvailable(order, items);
      await this.assertOrderLockOwned(data.orderId, lockId);
      const customer = order.customerId as unknown as {
        _id: Types.ObjectId;
        fullName: string;
        email?: string;
        phone?: string;
      };
      const branch = order.branchId as unknown as {
        _id: Types.ObjectId;
        name: string;
        address: string;
      };
      return await returnRepository.create({
        code: this.generateCode(),
        orderId: order._id.toString(),
        orderCode: order.code,
        customerId: customer._id.toString(),
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        branchId: branch._id.toString(),
        branchName: branch.name,
        branchAddress: branch.address,
        items,
        reason: data.reason,
        totalRefund: this.totalRefund(items),
        createdBy: actor.userId,
      });
    } finally {
      await returnRepository.releaseOrderLock(data.orderId, lockId);
    }
  }

  async updateReturn(
    id: string,
    data: { reason?: string; items?: ReturnItemInput[] },
    actor: BackOfficeActor
  ): Promise<IReturnRequest> {
    const existing = await this.getRawAccessibleReturn(id, actor);
    if (existing.status !== 'pending') {
      throw new AppError('Only pending return requests can be updated', 409);
    }

    const orderId = existing.orderId.toString();
    const order = await this.getDeliveredOrder(orderId, actor);
    const lockId = new Types.ObjectId().toString();
    await this.acquireOrderLock(orderId, lockId);

    try {
      const items = data.items
        ? await this.prepareItems(order, data.items, id)
        : existing.items;
      await this.ensureReturnQuantitiesAvailable(order, items, id);
      await this.assertOrderLockOwned(orderId, lockId);

      const updated = await returnRepository.updatePending(id, {
        reason: data.reason ?? existing.reason,
        items,
        totalRefund: this.totalRefund(items),
      });
      if (!updated) {
        throw new AppError('Return request changed by another request', 409);
      }
      return (await returnRepository.findById(id)) || updated;
    } finally {
      await returnRepository.releaseOrderLock(orderId, lockId);
    }
  }

  async cancelReturn(
    id: string,
    reason: string,
    actor: BackOfficeActor
  ): Promise<IReturnRequest> {
    const existing = await this.getRawAccessibleReturn(id, actor);
    if (!['pending', 'approved'].includes(existing.status)) {
      throw new AppError('Only pending or approved returns can be cancelled', 409);
    }

    const orderId = existing.orderId.toString();
    const lockId = new Types.ObjectId().toString();
    await this.acquireOrderLock(orderId, lockId);
    try {
      await this.assertOrderLockOwned(orderId, lockId);
      const updated = await returnRepository.updateStatus(
        id,
        ['pending', 'approved'],
        {
          status: 'cancelled',
          cancelledBy: new Types.ObjectId(actor.userId),
          cancelledAt: new Date(),
          cancellationReason: reason,
        }
      );
      if (!updated) throw new AppError('Return request changed by another request', 409);
      return (await returnRepository.findById(id)) || updated;
    } finally {
      await returnRepository.releaseOrderLock(orderId, lockId);
    }
  }

  async approveReturn(
    id: string,
    note: string | undefined,
    actor: BackOfficeActor
  ): Promise<IReturnRequest> {
    await this.getRawAccessibleReturn(id, actor);
    const updated = await returnRepository.updateStatus(id, 'pending', {
      status: 'approved',
      reviewedBy: new Types.ObjectId(actor.userId),
      reviewedAt: new Date(),
      resolutionNote: note,
    });
    if (!updated) throw new AppError('Only pending returns can be approved', 409);
    return (await returnRepository.findById(id)) || updated;
  }

  async rejectReturn(
    id: string,
    note: string | undefined,
    actor: BackOfficeActor
  ): Promise<IReturnRequest> {
    await this.getRawAccessibleReturn(id, actor);
    const updated = await returnRepository.updateStatus(id, 'pending', {
      status: 'rejected',
      reviewedBy: new Types.ObjectId(actor.userId),
      reviewedAt: new Date(),
      resolutionNote: note,
    });
    if (!updated) throw new AppError('Only pending returns can be rejected', 409);
    return (await returnRepository.findById(id)) || updated;
  }

  async completeReturn(
    id: string,
    refund: {
      refundMethod: RefundMethod;
      refundReference?: string;
    },
    actor: BackOfficeActor
  ): Promise<IReturnRequest> {
    const accessible = await this.getRawAccessibleReturn(id, actor);
    if (!['approved', 'completing'].includes(accessible.status)) {
      throw new AppError('Only approved returns can be completed', 409);
    }
    await this.ensureRestockInventoryExists(accessible);

    const completionLockId = new Types.ObjectId().toString();
    const request = await returnRepository.acquireForCompletion(
      id,
      completionLockId
    );
    if (!request) {
      throw new AppError('Return is already being completed or has changed', 409);
    }

    const restocked: { productId: string; quantity: number }[] = [];
    let resumedAppliedStock = false;
    let completionLeaseLost = false;
    try {
      for (const item of request.items) {
        if (item.condition !== 'resellable') continue;
        const lockOwned = await returnRepository.renewCompletionLock(
          id,
          completionLockId
        );
        if (!lockOwned) {
          completionLeaseLost = true;
          throw new AppError(
            'Return completion lease was replaced. Please retry.',
            409
          );
        }
        const productId = item.productId.toString();
        const result = await inventoryRepository.applyReturnStock({
          returnId: request._id.toString(),
          branchId: request.branchId.toString(),
          productId,
          quantity: item.quantity,
          updatedBy: actor.userId,
        });
        if (!result.inventory) {
          throw new AppError(
            `Inventory record not found for returned product ${productId}`,
            409
          );
        }
        if (result.applied) {
          restocked.push({ productId, quantity: item.quantity });
        } else {
          resumedAppliedStock = true;
        }
      }

      const lockOwned = await returnRepository.renewCompletionLock(
        id,
        completionLockId
      );
      if (!lockOwned) {
        completionLeaseLost = true;
        throw new AppError(
          'Return completion lease was replaced. Please retry.',
          409
        );
      }
      const completed = await returnRepository.completeWithLock(
        id,
        completionLockId,
        {
        status: 'completed',
        completedBy: new Types.ObjectId(actor.userId),
        completedAt: new Date(),
        refundStatus: 'completed',
        refundMethod: refund.refundMethod,
        refundReference: refund.refundReference,
        refundedBy: new Types.ObjectId(actor.userId),
        refundedAt: new Date(),
        }
      );
      if (!completed) {
        const stillOwned = await returnRepository.renewCompletionLock(
          id,
          completionLockId
        );
        if (!stillOwned) completionLeaseLost = true;
        throw new AppError('Return completion conflict', 409);
      }
      return (await returnRepository.findById(id)) || completed;
    } catch (error) {
      if (completionLeaseLost) {
        console.error('[RETURN_COMPLETION_LEASE_LOST]', {
          returnId: id,
          completionLockId,
        });
        throw error;
      }
      const rollbackSucceeded = await this.rollbackRestock(
        request.branchId.toString(),
        request._id.toString(),
        restocked,
        actor.userId
      );
      if (rollbackSucceeded && !resumedAppliedStock) {
        await returnRepository.releaseCompletion(id, completionLockId);
      } else {
        console.error('[RETURN_REQUIRES_COMPLETION_RETRY]', {
          returnId: id,
          branchId: request.branchId.toString(),
          restocked,
          resumedAppliedStock,
          rollbackSucceeded,
        });
      }
      throw error;
    }
  }

  private async getRawAccessibleReturn(
    id: string,
    actor: BackOfficeActor
  ): Promise<IReturnRequest> {
    const request = await returnRepository.findRawById(id);
    if (!request) throw new AppError('Return request not found', 404);
    await assertBackOfficeBranchAccess(actor, request.branchId.toString());
    return request;
  }

  private async getDeliveredOrder(
    orderId: string,
    actor: BackOfficeActor
  ): Promise<IOrder> {
    const order = await returnRepository.findOrder(orderId);
    if (!order) throw new AppError('Order not found', 404);
    await assertBackOfficeBranchAccess(actor, this.objectId(order.branchId));
    if (order.status !== 'delivered') {
      throw new AppError('Returns can only be created for delivered orders', 409);
    }
    return order;
  }

  private async acquireOrderLock(orderId: string, lockId: string): Promise<void> {
    const locked = await returnRepository.acquireOrderLock(orderId, lockId);
    if (!locked) {
      const order = await returnRepository.findOrder(orderId);
      if (!order) throw new AppError('Order not found', 404);
      if (order.status !== 'delivered') {
        throw new AppError('Returns can only be changed for delivered orders', 409);
      }
      throw new AppError('Another return operation is in progress for this order', 409);
    }
  }

  private async assertOrderLockOwned(
    orderId: string,
    lockId: string
  ): Promise<void> {
    const owned = await returnRepository.renewOrderLock(orderId, lockId);
    if (!owned) {
      throw new AppError(
        'Return operation lease was replaced. Please retry.',
        409
      );
    }
  }

  private async prepareItems(
    order: IOrder,
    inputs: ReturnItemInput[],
    excludeReturnId?: string
  ): Promise<IReturnItem[]> {
    const listedTotal = order.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    const refundableTotal = Math.round(
      Math.min(order.totalAmount, listedTotal)
    );
    const groupedItems = new Map<
      string,
      {
        productId: Types.ObjectId;
        productName: string;
        quantity: number;
        subtotal: number;
      }
    >();

    for (const item of order.items) {
      const productId = this.objectId(item.productId);
      const product = item.productId as unknown as { name?: string };
      const current = groupedItems.get(productId);
      if (current) {
        current.quantity += item.quantity;
        current.subtotal += item.subtotal;
      } else {
        groupedItems.set(productId, {
          productId: new Types.ObjectId(productId),
          productName: product.name || 'Unknown product',
          quantity: item.quantity,
          subtotal: item.subtotal,
        });
      }
    }

    const allocations = [...groupedItems.entries()].map(([productId, item]) => {
      const exact =
        listedTotal > 0 ? (item.subtotal * refundableTotal) / listedTotal : 0;
      return {
        productId,
        allocated: Math.floor(exact),
        fraction: exact - Math.floor(exact),
      };
    });
    let remainder =
      refundableTotal -
      allocations.reduce((sum, allocation) => sum + allocation.allocated, 0);
    allocations.sort(
      (left, right) =>
        right.fraction - left.fraction ||
        left.productId.localeCompare(right.productId)
    );
    for (const allocation of allocations) {
      if (remainder <= 0) break;
      allocation.allocated += 1;
      remainder -= 1;
    }
    const allocatedByProduct = new Map(
      allocations.map((allocation) => [
        allocation.productId,
        allocation.allocated,
      ])
    );
    const reserved = await returnRepository.getReservedSummary(
      order._id.toString(),
      excludeReturnId
    );

    return inputs.map((input) => {
      const orderItem = groupedItems.get(input.productId);
      if (!orderItem) {
        throw new AppError(
          `Product ${input.productId} does not belong to this order`,
          400
        );
      }
      const allocatedLineTotal = allocatedByProduct.get(input.productId) || 0;
      const prior = reserved.get(input.productId) || {
        quantity: 0,
        refundAmount: 0,
      };
      const availableQuantity = orderItem.quantity - prior.quantity;
      if (input.quantity > availableQuantity) {
        throw new AppError(
          `Return quantity for product ${input.productId} exceeds the remaining returnable quantity (${availableQuantity})`,
          409
        );
      }

      const remainingRefund = Math.max(
        0,
        allocatedLineTotal - prior.refundAmount
      );
      const baseUnitRefund =
        availableQuantity > 0
          ? Math.floor(remainingRefund / availableQuantity)
          : 0;
      const extraUnitCount =
        availableQuantity > 0 ? remainingRefund % availableQuantity : 0;
      const refundAmount =
        input.quantity === availableQuantity
          ? remainingRefund
          : input.quantity * baseUnitRefund +
            Math.min(input.quantity, extraUnitCount);
      return {
        productId: orderItem.productId,
        productName: orderItem.productName,
        quantity: input.quantity,
        unitPrice: input.quantity > 0 ? refundAmount / input.quantity : 0,
        refundAmount,
        condition: input.condition,
      };
    });
  }

  private async ensureReturnQuantitiesAvailable(
    order: IOrder,
    items: IReturnItem[],
    excludeReturnId?: string
  ): Promise<void> {
    const purchased = new Map<string, number>();
    for (const item of order.items) {
      const productId = this.objectId(item.productId);
      purchased.set(productId, (purchased.get(productId) || 0) + item.quantity);
    }
    const reserved = await returnRepository.getReservedSummary(
      order._id.toString(),
      excludeReturnId
    );

    for (const item of items) {
      const productId = item.productId.toString();
      const available =
        (purchased.get(productId) || 0) -
        (reserved.get(productId)?.quantity || 0);
      if (item.quantity > available) {
        throw new AppError(
          `Return quantity for product ${productId} exceeds the remaining returnable quantity (${available})`,
          409
        );
      }
    }
  }

  private async ensureRestockInventoryExists(
    request: IReturnRequest
  ): Promise<void> {
    for (const item of request.items) {
      if (item.condition !== 'resellable') continue;
      const inventory = await inventoryRepository.findInventoryItem(
        request.branchId.toString(),
        item.productId.toString()
      );
      if (!inventory) {
        throw new AppError(
          `Inventory record not found for returned product ${item.productId.toString()}`,
          409
        );
      }
    }
  }

  private async rollbackRestock(
    branchId: string,
    returnId: string,
    items: { productId: string; quantity: number }[],
    actorId: string
  ): Promise<boolean> {
    let succeeded = true;
    for (const item of items.reverse()) {
      const rolledBack = await inventoryRepository.rollbackReturnStock({
        returnId,
        branchId,
        productId: item.productId,
        quantity: item.quantity,
        updatedBy: actorId,
      });
      if (!rolledBack) succeeded = false;
    }
    return succeeded;
  }

  private totalRefund(items: IReturnItem[]): number {
    return items.reduce((sum, item) => sum + item.refundAmount, 0);
  }

  private generateCode(): string {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `RET-${stamp}-${random}`;
  }

  private objectId(value: unknown): string {
    if (value && typeof value === 'object' && '_id' in value) {
      return String((value as { _id: Types.ObjectId })._id);
    }
    return String(value);
  }
}

export const returnService = new ReturnService();
