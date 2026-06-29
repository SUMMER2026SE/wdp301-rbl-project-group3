"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnService = exports.ReturnService = void 0;
const mongoose_1 = require("mongoose");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const backOfficeAccess_util_1 = require("../../utils/backOfficeAccess.util");
const inventory_repository_1 = require("../inventory/inventory.repository");
const return_repository_1 = require("./return.repository");
class ReturnService {
    async listReturns(filters, actor) {
        const branchId = await (0, backOfficeAccess_util_1.resolveBackOfficeBranch)(actor, filters.branchId);
        const result = await return_repository_1.returnRepository.findPaginated({ ...filters, branchId }, filters.page, filters.limit);
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
    async getReturn(id, actor) {
        const request = await return_repository_1.returnRepository.findById(id);
        if (!request)
            throw new errorHandler_middleware_1.AppError('Return request not found', 404);
        await (0, backOfficeAccess_util_1.assertBackOfficeBranchAccess)(actor, this.objectId(request.branchId));
        return request;
    }
    async createReturn(data, actor) {
        const order = await this.getDeliveredOrder(data.orderId, actor);
        const lockId = new mongoose_1.Types.ObjectId().toString();
        await this.acquireOrderLock(data.orderId, lockId);
        try {
            const items = await this.prepareItems(order, data.items);
            await this.ensureReturnQuantitiesAvailable(order, items);
            await this.assertOrderLockOwned(data.orderId, lockId);
            const customer = order.customerId;
            const branch = order.branchId;
            return await return_repository_1.returnRepository.create({
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
        }
        finally {
            await return_repository_1.returnRepository.releaseOrderLock(data.orderId, lockId);
        }
    }
    async updateReturn(id, data, actor) {
        const existing = await this.getRawAccessibleReturn(id, actor);
        if (existing.status !== 'pending') {
            throw new errorHandler_middleware_1.AppError('Only pending return requests can be updated', 409);
        }
        const orderId = existing.orderId.toString();
        const order = await this.getDeliveredOrder(orderId, actor);
        const lockId = new mongoose_1.Types.ObjectId().toString();
        await this.acquireOrderLock(orderId, lockId);
        try {
            const items = data.items
                ? await this.prepareItems(order, data.items, id)
                : existing.items;
            await this.ensureReturnQuantitiesAvailable(order, items, id);
            await this.assertOrderLockOwned(orderId, lockId);
            const updated = await return_repository_1.returnRepository.updatePending(id, {
                reason: data.reason ?? existing.reason,
                items,
                totalRefund: this.totalRefund(items),
            });
            if (!updated) {
                throw new errorHandler_middleware_1.AppError('Return request changed by another request', 409);
            }
            return (await return_repository_1.returnRepository.findById(id)) || updated;
        }
        finally {
            await return_repository_1.returnRepository.releaseOrderLock(orderId, lockId);
        }
    }
    async cancelReturn(id, reason, actor) {
        const existing = await this.getRawAccessibleReturn(id, actor);
        if (!['pending', 'approved'].includes(existing.status)) {
            throw new errorHandler_middleware_1.AppError('Only pending or approved returns can be cancelled', 409);
        }
        const orderId = existing.orderId.toString();
        const lockId = new mongoose_1.Types.ObjectId().toString();
        await this.acquireOrderLock(orderId, lockId);
        try {
            await this.assertOrderLockOwned(orderId, lockId);
            const updated = await return_repository_1.returnRepository.updateStatus(id, ['pending', 'approved'], {
                status: 'cancelled',
                cancelledBy: new mongoose_1.Types.ObjectId(actor.userId),
                cancelledAt: new Date(),
                cancellationReason: reason,
            });
            if (!updated)
                throw new errorHandler_middleware_1.AppError('Return request changed by another request', 409);
            return (await return_repository_1.returnRepository.findById(id)) || updated;
        }
        finally {
            await return_repository_1.returnRepository.releaseOrderLock(orderId, lockId);
        }
    }
    async approveReturn(id, note, actor) {
        await this.getRawAccessibleReturn(id, actor);
        const updated = await return_repository_1.returnRepository.updateStatus(id, 'pending', {
            status: 'approved',
            reviewedBy: new mongoose_1.Types.ObjectId(actor.userId),
            reviewedAt: new Date(),
            resolutionNote: note,
        });
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Only pending returns can be approved', 409);
        return (await return_repository_1.returnRepository.findById(id)) || updated;
    }
    async rejectReturn(id, note, actor) {
        await this.getRawAccessibleReturn(id, actor);
        const updated = await return_repository_1.returnRepository.updateStatus(id, 'pending', {
            status: 'rejected',
            reviewedBy: new mongoose_1.Types.ObjectId(actor.userId),
            reviewedAt: new Date(),
            resolutionNote: note,
        });
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Only pending returns can be rejected', 409);
        return (await return_repository_1.returnRepository.findById(id)) || updated;
    }
    async completeReturn(id, refund, actor) {
        const accessible = await this.getRawAccessibleReturn(id, actor);
        if (!['approved', 'completing'].includes(accessible.status)) {
            throw new errorHandler_middleware_1.AppError('Only approved returns can be completed', 409);
        }
        await this.ensureRestockInventoryExists(accessible);
        const completionLockId = new mongoose_1.Types.ObjectId().toString();
        const request = await return_repository_1.returnRepository.acquireForCompletion(id, completionLockId);
        if (!request) {
            throw new errorHandler_middleware_1.AppError('Return is already being completed or has changed', 409);
        }
        const restocked = [];
        let resumedAppliedStock = false;
        let completionLeaseLost = false;
        try {
            for (const item of request.items) {
                if (item.condition !== 'resellable')
                    continue;
                const lockOwned = await return_repository_1.returnRepository.renewCompletionLock(id, completionLockId);
                if (!lockOwned) {
                    completionLeaseLost = true;
                    throw new errorHandler_middleware_1.AppError('Return completion lease was replaced. Please retry.', 409);
                }
                const productId = item.productId.toString();
                const result = await inventory_repository_1.inventoryRepository.applyReturnStock({
                    returnId: request._id.toString(),
                    branchId: request.branchId.toString(),
                    productId,
                    quantity: item.quantity,
                    updatedBy: actor.userId,
                });
                if (!result.inventory) {
                    throw new errorHandler_middleware_1.AppError(`Inventory record not found for returned product ${productId}`, 409);
                }
                if (result.applied) {
                    restocked.push({ productId, quantity: item.quantity });
                }
                else {
                    resumedAppliedStock = true;
                }
            }
            const lockOwned = await return_repository_1.returnRepository.renewCompletionLock(id, completionLockId);
            if (!lockOwned) {
                completionLeaseLost = true;
                throw new errorHandler_middleware_1.AppError('Return completion lease was replaced. Please retry.', 409);
            }
            const completed = await return_repository_1.returnRepository.completeWithLock(id, completionLockId, {
                status: 'completed',
                completedBy: new mongoose_1.Types.ObjectId(actor.userId),
                completedAt: new Date(),
                refundStatus: 'completed',
                refundMethod: refund.refundMethod,
                refundReference: refund.refundReference,
                refundedBy: new mongoose_1.Types.ObjectId(actor.userId),
                refundedAt: new Date(),
            });
            if (!completed) {
                const stillOwned = await return_repository_1.returnRepository.renewCompletionLock(id, completionLockId);
                if (!stillOwned)
                    completionLeaseLost = true;
                throw new errorHandler_middleware_1.AppError('Return completion conflict', 409);
            }
            return (await return_repository_1.returnRepository.findById(id)) || completed;
        }
        catch (error) {
            if (completionLeaseLost) {
                console.error('[RETURN_COMPLETION_LEASE_LOST]', {
                    returnId: id,
                    completionLockId,
                });
                throw error;
            }
            const rollbackSucceeded = await this.rollbackRestock(request.branchId.toString(), request._id.toString(), restocked, actor.userId);
            if (rollbackSucceeded && !resumedAppliedStock) {
                await return_repository_1.returnRepository.releaseCompletion(id, completionLockId);
            }
            else {
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
    async getRawAccessibleReturn(id, actor) {
        const request = await return_repository_1.returnRepository.findRawById(id);
        if (!request)
            throw new errorHandler_middleware_1.AppError('Return request not found', 404);
        await (0, backOfficeAccess_util_1.assertBackOfficeBranchAccess)(actor, request.branchId.toString());
        return request;
    }
    async getDeliveredOrder(orderId, actor) {
        const order = await return_repository_1.returnRepository.findOrder(orderId);
        if (!order)
            throw new errorHandler_middleware_1.AppError('Order not found', 404);
        await (0, backOfficeAccess_util_1.assertBackOfficeBranchAccess)(actor, this.objectId(order.branchId));
        if (order.status !== 'delivered') {
            throw new errorHandler_middleware_1.AppError('Returns can only be created for delivered orders', 409);
        }
        return order;
    }
    async acquireOrderLock(orderId, lockId) {
        const locked = await return_repository_1.returnRepository.acquireOrderLock(orderId, lockId);
        if (!locked) {
            const order = await return_repository_1.returnRepository.findOrder(orderId);
            if (!order)
                throw new errorHandler_middleware_1.AppError('Order not found', 404);
            if (order.status !== 'delivered') {
                throw new errorHandler_middleware_1.AppError('Returns can only be changed for delivered orders', 409);
            }
            throw new errorHandler_middleware_1.AppError('Another return operation is in progress for this order', 409);
        }
    }
    async assertOrderLockOwned(orderId, lockId) {
        const owned = await return_repository_1.returnRepository.renewOrderLock(orderId, lockId);
        if (!owned) {
            throw new errorHandler_middleware_1.AppError('Return operation lease was replaced. Please retry.', 409);
        }
    }
    async prepareItems(order, inputs, excludeReturnId) {
        const listedTotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
        const refundableTotal = Math.round(Math.min(order.totalAmount, listedTotal));
        const groupedItems = new Map();
        for (const item of order.items) {
            const productId = this.objectId(item.productId);
            const product = item.productId;
            const current = groupedItems.get(productId);
            if (current) {
                current.quantity += item.quantity;
                current.subtotal += item.subtotal;
            }
            else {
                groupedItems.set(productId, {
                    productId: new mongoose_1.Types.ObjectId(productId),
                    productName: product.name || 'Unknown product',
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                });
            }
        }
        const allocations = [...groupedItems.entries()].map(([productId, item]) => {
            const exact = listedTotal > 0 ? (item.subtotal * refundableTotal) / listedTotal : 0;
            return {
                productId,
                allocated: Math.floor(exact),
                fraction: exact - Math.floor(exact),
            };
        });
        let remainder = refundableTotal -
            allocations.reduce((sum, allocation) => sum + allocation.allocated, 0);
        allocations.sort((left, right) => right.fraction - left.fraction ||
            left.productId.localeCompare(right.productId));
        for (const allocation of allocations) {
            if (remainder <= 0)
                break;
            allocation.allocated += 1;
            remainder -= 1;
        }
        const allocatedByProduct = new Map(allocations.map((allocation) => [
            allocation.productId,
            allocation.allocated,
        ]));
        const reserved = await return_repository_1.returnRepository.getReservedSummary(order._id.toString(), excludeReturnId);
        return inputs.map((input) => {
            const orderItem = groupedItems.get(input.productId);
            if (!orderItem) {
                throw new errorHandler_middleware_1.AppError(`Product ${input.productId} does not belong to this order`, 400);
            }
            const allocatedLineTotal = allocatedByProduct.get(input.productId) || 0;
            const prior = reserved.get(input.productId) || {
                quantity: 0,
                refundAmount: 0,
            };
            const availableQuantity = orderItem.quantity - prior.quantity;
            if (input.quantity > availableQuantity) {
                throw new errorHandler_middleware_1.AppError(`Return quantity for product ${input.productId} exceeds the remaining returnable quantity (${availableQuantity})`, 409);
            }
            const remainingRefund = Math.max(0, allocatedLineTotal - prior.refundAmount);
            const baseUnitRefund = availableQuantity > 0
                ? Math.floor(remainingRefund / availableQuantity)
                : 0;
            const extraUnitCount = availableQuantity > 0 ? remainingRefund % availableQuantity : 0;
            const refundAmount = input.quantity === availableQuantity
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
    async ensureReturnQuantitiesAvailable(order, items, excludeReturnId) {
        const purchased = new Map();
        for (const item of order.items) {
            const productId = this.objectId(item.productId);
            purchased.set(productId, (purchased.get(productId) || 0) + item.quantity);
        }
        const reserved = await return_repository_1.returnRepository.getReservedSummary(order._id.toString(), excludeReturnId);
        for (const item of items) {
            const productId = item.productId.toString();
            const available = (purchased.get(productId) || 0) -
                (reserved.get(productId)?.quantity || 0);
            if (item.quantity > available) {
                throw new errorHandler_middleware_1.AppError(`Return quantity for product ${productId} exceeds the remaining returnable quantity (${available})`, 409);
            }
        }
    }
    async ensureRestockInventoryExists(request) {
        for (const item of request.items) {
            if (item.condition !== 'resellable')
                continue;
            const inventory = await inventory_repository_1.inventoryRepository.findInventoryItem(request.branchId.toString(), item.productId.toString());
            if (!inventory) {
                throw new errorHandler_middleware_1.AppError(`Inventory record not found for returned product ${item.productId.toString()}`, 409);
            }
        }
    }
    async rollbackRestock(branchId, returnId, items, actorId) {
        let succeeded = true;
        for (const item of items.reverse()) {
            const rolledBack = await inventory_repository_1.inventoryRepository.rollbackReturnStock({
                returnId,
                branchId,
                productId: item.productId,
                quantity: item.quantity,
                updatedBy: actorId,
            });
            if (!rolledBack)
                succeeded = false;
        }
        return succeeded;
    }
    totalRefund(items) {
        return items.reduce((sum, item) => sum + item.refundAmount, 0);
    }
    generateCode() {
        const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `RET-${stamp}-${random}`;
    }
    objectId(value) {
        if (value && typeof value === 'object' && '_id' in value) {
            return String(value._id);
        }
        return String(value);
    }
}
exports.ReturnService = ReturnService;
exports.returnService = new ReturnService();
//# sourceMappingURL=return.service.js.map