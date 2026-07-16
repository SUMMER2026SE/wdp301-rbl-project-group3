"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnRepository = exports.ReturnRepository = void 0;
const mongoose_1 = require("mongoose");
const order_model_1 = require("../../models/order.model");
const returnRequest_model_1 = require("../../models/returnRequest.model");
class ReturnRepository {
    async findOrder(orderId) {
        return order_model_1.Order.findById(orderId)
            .populate('customerId', 'fullName email phone')
            .populate('branchId', 'name code address')
            .populate('items.productId', 'name sku unit')
            .exec();
    }
    async acquireOrderLock(orderId, lockId) {
        const staleAt = new Date(Date.now() - 5 * 60 * 1000);
        return order_model_1.Order.findOneAndUpdate({
            _id: orderId,
            status: 'delivered',
            $or: [
                { returnMutationLockedAt: { $exists: false } },
                { returnMutationLockedAt: { $lt: staleAt } },
            ],
        }, {
            $set: {
                returnMutationLockedAt: new Date(),
                returnMutationLockId: lockId,
            },
        }, { new: true }).exec();
    }
    async releaseOrderLock(orderId, lockId) {
        await order_model_1.Order.updateOne({ _id: orderId, returnMutationLockId: lockId }, {
            $unset: {
                returnMutationLockedAt: 1,
                returnMutationLockId: 1,
            },
        }).exec();
    }
    async findPaginated(filters, page, limit) {
        const query = {};
        if (filters.branchId)
            query.branchId = new mongoose_1.Types.ObjectId(filters.branchId);
        if (filters.orderId)
            query.orderId = new mongoose_1.Types.ObjectId(filters.orderId);
        if (filters.customerId)
            query.customerId = new mongoose_1.Types.ObjectId(filters.customerId);
        if (filters.status)
            query.status = filters.status;
        const [returns, total] = await Promise.all([
            returnRequest_model_1.ReturnRequest.find(query)
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
            returnRequest_model_1.ReturnRequest.countDocuments(query).exec(),
        ]);
        return {
            returns,
            total,
            page,
            limit,
            totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        };
    }
    async findById(id) {
        return returnRequest_model_1.ReturnRequest.findById(id)
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
    async findRawById(id) {
        return returnRequest_model_1.ReturnRequest.findById(id).exec();
    }
    async getReservedSummary(orderId, excludeReturnId) {
        const query = {
            orderId: new mongoose_1.Types.ObjectId(orderId),
            status: { $in: ['pending', 'approved', 'completing', 'completed'] },
        };
        if (excludeReturnId)
            query._id = { $ne: new mongoose_1.Types.ObjectId(excludeReturnId) };
        const returns = await returnRequest_model_1.ReturnRequest.find(query).select('items').lean().exec();
        const reserved = new Map();
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
    async create(data) {
        return new returnRequest_model_1.ReturnRequest(data).save();
    }
    async updatePending(id, data) {
        return returnRequest_model_1.ReturnRequest.findOneAndUpdate({ _id: id, status: 'pending' }, { $set: data }, { new: true, runValidators: true }).exec();
    }
    async updateStatus(id, expectedStatus, data) {
        const statusCondition = Array.isArray(expectedStatus)
            ? { $in: expectedStatus }
            : expectedStatus;
        return returnRequest_model_1.ReturnRequest.findOneAndUpdate({ _id: id, status: statusCondition }, { $set: data }, { new: true, runValidators: true }).exec();
    }
    async acquireForCompletion(id, lockId) {
        const staleAt = new Date(Date.now() - 5 * 60 * 1000);
        return returnRequest_model_1.ReturnRequest.findOneAndUpdate({
            _id: id,
            $or: [
                { status: 'approved' },
                {
                    status: 'completing',
                    completionLockedAt: { $lt: staleAt },
                },
            ],
        }, {
            $set: {
                status: 'completing',
                completionLockId: lockId,
                completionLockedAt: new Date(),
            },
        }, { new: true }).exec();
    }
    async renewCompletionLock(id, lockId) {
        const result = await returnRequest_model_1.ReturnRequest.updateOne({ _id: id, status: 'completing', completionLockId: lockId }, { $set: { completionLockedAt: new Date() } }).exec();
        return result.matchedCount === 1;
    }
    async renewOrderLock(orderId, lockId) {
        const result = await order_model_1.Order.updateOne({ _id: orderId, returnMutationLockId: lockId }, { $set: { returnMutationLockedAt: new Date() } }).exec();
        return result.matchedCount === 1;
    }
    async completeWithLock(id, lockId, data) {
        return returnRequest_model_1.ReturnRequest.findOneAndUpdate({ _id: id, status: 'completing', completionLockId: lockId }, {
            $set: data,
            $unset: {
                completionLockId: 1,
                completionLockedAt: 1,
            },
        }, { new: true, runValidators: true }).exec();
    }
    async releaseCompletion(id, lockId) {
        await returnRequest_model_1.ReturnRequest.updateOne({ _id: id, status: 'completing', completionLockId: lockId }, {
            $set: { status: 'approved' },
            $unset: {
                completionLockId: 1,
                completionLockedAt: 1,
            },
        }).exec();
    }
}
exports.ReturnRepository = ReturnRepository;
exports.returnRepository = new ReturnRepository();
//# sourceMappingURL=return.repository.js.map