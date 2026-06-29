"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRepository = exports.InventoryRepository = void 0;
const mongoose_1 = require("mongoose");
const inventory_model_1 = require("../../models/inventory.model");
const importReceipt_model_1 = require("../../models/importReceipt.model");
class InventoryRepository {
    async findInventory(filters) {
        const query = {};
        if (filters.branchId)
            query.branchId = filters.branchId;
        if (filters.productId)
            query.productId = filters.productId;
        if (filters.lowStock)
            query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
        return inventory_model_1.Inventory.find(query)
            .populate('branchId', 'name code address')
            .populate('productId', 'name sku unit salePrice imageUrl')
            .sort({ updatedAt: -1 })
            .exec();
    }
    async findInventoryItem(branchId, productId) {
        return inventory_model_1.Inventory.findOne({ branchId, productId }).exec();
    }
    async deleteInventoryItem(branchId, productId) {
        await inventory_model_1.Inventory.deleteOne({ branchId, productId }).exec();
    }
    async restoreInventoryItem(data) {
        return inventory_model_1.Inventory.findOneAndUpdate({
            branchId: data.branchId,
            productId: data.productId,
        }, {
            quantity: data.quantity,
            averageCost: data.averageCost,
            lastImportCost: data.lastImportCost,
            lowStockThreshold: data.lowStockThreshold,
            updatedBy: data.updatedBy ? new mongoose_1.Types.ObjectId(data.updatedBy) : undefined,
        }, { new: true, upsert: true, setDefaultsOnInsert: true }).exec();
    }
    async decreaseStock(params) {
        return inventory_model_1.Inventory.findOneAndUpdate({
            branchId: params.branchId,
            productId: params.productId,
            quantity: { $gte: params.quantity },
        }, {
            $inc: { quantity: -params.quantity },
            $set: { updatedBy: new mongoose_1.Types.ObjectId(params.updatedBy) },
        }, { new: true }).exec();
    }
    async increaseStock(params) {
        return inventory_model_1.Inventory.findOneAndUpdate({
            branchId: params.branchId,
            productId: params.productId,
        }, {
            $inc: { quantity: params.quantity },
            $set: { updatedBy: new mongoose_1.Types.ObjectId(params.updatedBy) },
        }, { new: true }).exec();
    }
    async applyOrderStockDeduction(params) {
        const orderObjectId = new mongoose_1.Types.ObjectId(params.orderId);
        const inventory = await inventory_model_1.Inventory.findOneAndUpdate({
            branchId: params.branchId,
            productId: params.productId,
            quantity: { $gte: params.quantity },
            deductedOrderIds: { $ne: orderObjectId },
        }, {
            $inc: { quantity: -params.quantity },
            $addToSet: { deductedOrderIds: orderObjectId },
            $pull: { restoredOrderIds: orderObjectId },
            $set: { updatedBy: new mongoose_1.Types.ObjectId(params.updatedBy) },
        }, { new: true })
            .select('+deductedOrderIds +restoredOrderIds')
            .exec();
        if (inventory)
            return { inventory, applied: true };
        const existing = await inventory_model_1.Inventory.findOne({
            branchId: params.branchId,
            productId: params.productId,
        })
            .select('+deductedOrderIds +restoredOrderIds')
            .exec();
        if (!existing)
            return { inventory: null, applied: false };
        const alreadyDeducted = existing.deductedOrderIds.some((id) => id.toString() === params.orderId);
        return {
            inventory: alreadyDeducted ? existing : null,
            applied: false,
        };
    }
    async restoreOrderStockDeduction(params) {
        const orderObjectId = new mongoose_1.Types.ObjectId(params.orderId);
        const restored = await inventory_model_1.Inventory.findOneAndUpdate({
            branchId: params.branchId,
            productId: params.productId,
            deductedOrderIds: orderObjectId,
        }, {
            $inc: { quantity: params.quantity },
            $pull: { deductedOrderIds: orderObjectId },
            $addToSet: { restoredOrderIds: orderObjectId },
            $set: { updatedBy: new mongoose_1.Types.ObjectId(params.updatedBy) },
        }, { new: true })
            .select('+deductedOrderIds +restoredOrderIds')
            .exec();
        if (restored)
            return { inventory: restored, restored: true };
        const existing = await inventory_model_1.Inventory.findOne({
            branchId: params.branchId,
            productId: params.productId,
        })
            .select('+deductedOrderIds +restoredOrderIds')
            .exec();
        if (!existing)
            return { inventory: null, restored: false };
        const alreadyRestored = existing.restoredOrderIds.some((id) => id.toString() === params.orderId);
        if (alreadyRestored || !params.allowLegacy) {
            return { inventory: existing, restored: false };
        }
        const legacyRestored = await inventory_model_1.Inventory.findOneAndUpdate({
            branchId: params.branchId,
            productId: params.productId,
            deductedOrderIds: { $ne: orderObjectId },
            restoredOrderIds: { $ne: orderObjectId },
        }, {
            $inc: { quantity: params.quantity },
            $addToSet: { restoredOrderIds: orderObjectId },
            $set: { updatedBy: new mongoose_1.Types.ObjectId(params.updatedBy) },
        }, { new: true })
            .select('+deductedOrderIds +restoredOrderIds')
            .exec();
        return {
            inventory: legacyRestored || existing,
            restored: Boolean(legacyRestored),
        };
    }
    async applyReturnStock(params) {
        const returnObjectId = new mongoose_1.Types.ObjectId(params.returnId);
        const inventory = await inventory_model_1.Inventory.findOneAndUpdate({
            branchId: params.branchId,
            productId: params.productId,
            appliedReturnIds: { $ne: returnObjectId },
        }, {
            $inc: { quantity: params.quantity },
            $addToSet: { appliedReturnIds: returnObjectId },
            $set: { updatedBy: new mongoose_1.Types.ObjectId(params.updatedBy) },
        }, { new: true })
            .select('+appliedReturnIds')
            .exec();
        if (inventory)
            return { inventory, applied: true };
        const existing = await inventory_model_1.Inventory.findOne({
            branchId: params.branchId,
            productId: params.productId,
        })
            .select('+appliedReturnIds')
            .exec();
        if (!existing)
            return { inventory: null, applied: false };
        const alreadyApplied = existing.appliedReturnIds.some((id) => id.toString() === params.returnId);
        return {
            inventory: alreadyApplied ? existing : null,
            applied: false,
        };
    }
    async rollbackReturnStock(params) {
        const result = await inventory_model_1.Inventory.updateOne({
            branchId: params.branchId,
            productId: params.productId,
            quantity: { $gte: params.quantity },
            appliedReturnIds: new mongoose_1.Types.ObjectId(params.returnId),
        }, {
            $inc: { quantity: -params.quantity },
            $pull: { appliedReturnIds: new mongoose_1.Types.ObjectId(params.returnId) },
            $set: { updatedBy: new mongoose_1.Types.ObjectId(params.updatedBy) },
        }).exec();
        return result.modifiedCount === 1;
    }
    async upsertStock(params) {
        const existing = await inventory_model_1.Inventory.findOne({
            branchId: params.branchId,
            productId: params.productId,
        }).exec();
        if (!existing) {
            return new inventory_model_1.Inventory({
                branchId: params.branchId,
                productId: params.productId,
                quantity: params.quantityToAdd,
                averageCost: params.unitCost,
                lastImportCost: params.unitCost,
                updatedBy: params.updatedBy,
            }).save();
        }
        const currentValue = existing.quantity * existing.averageCost;
        const importedValue = params.quantityToAdd * params.unitCost;
        const newQuantity = existing.quantity + params.quantityToAdd;
        existing.quantity = newQuantity;
        existing.averageCost = newQuantity > 0 ? (currentValue + importedValue) / newQuantity : 0;
        existing.lastImportCost = params.unitCost;
        existing.updatedBy = new mongoose_1.Types.ObjectId(params.updatedBy);
        return existing.save();
    }
    async reverseImportedStock(params) {
        const inventory = await inventory_model_1.Inventory.findOne({
            branchId: params.branchId,
            productId: params.productId,
        }).exec();
        if (!inventory || inventory.quantity < params.quantityToRemove) {
            return null;
        }
        const remainingQuantity = inventory.quantity - params.quantityToRemove;
        const remainingValue = inventory.quantity * inventory.averageCost -
            params.quantityToRemove * params.unitCost;
        if (remainingValue < -0.01) {
            return null;
        }
        inventory.quantity = remainingQuantity;
        inventory.averageCost =
            remainingQuantity > 0 ? Math.max(0, remainingValue) / remainingQuantity : 0;
        inventory.lastImportCost = params.replacementLastImportCost;
        inventory.updatedBy = new mongoose_1.Types.ObjectId(params.updatedBy);
        return inventory.save();
    }
    async createImportReceipt(data) {
        return new importReceipt_model_1.ImportReceipt(data).save();
    }
    async findImportReceipts(filters) {
        const query = {};
        if (filters.branchId)
            query.branchId = filters.branchId;
        if (filters.status === 'active')
            query.status = { $nin: ['adjusting', 'cancelled'] };
        if (filters.status === 'cancelled')
            query.status = 'cancelled';
        if (!filters.status)
            query.status = { $ne: 'adjusting' };
        return importReceipt_model_1.ImportReceipt.find(query)
            .populate('branchId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email')
            .populate('cancelledBy', 'fullName email')
            .populate('items.productId', 'name sku unit')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findImportReceiptById(id) {
        return importReceipt_model_1.ImportReceipt.findById(id).exec();
    }
    async acquireImportReceiptForMutation(id) {
        const staleLockThreshold = new Date(Date.now() - 5 * 60 * 1000);
        return importReceipt_model_1.ImportReceipt.findOneAndUpdate({
            _id: id,
            status: { $ne: 'cancelled' },
            $or: [
                { status: { $ne: 'adjusting' } },
                { mutationLockedAt: { $lt: staleLockThreshold } },
                { mutationLockedAt: { $exists: false } },
            ],
        }, {
            $set: {
                status: 'adjusting',
                mutationLockedAt: new Date(),
            },
        }, { new: true }).exec();
    }
    async releaseImportReceiptMutation(id) {
        await importReceipt_model_1.ImportReceipt.findOneAndUpdate({ _id: id, status: 'adjusting' }, {
            $set: { status: 'active' },
            $unset: { mutationLockedAt: 1 },
        }).exec();
    }
    async findImportReceiptDetail(id) {
        return importReceipt_model_1.ImportReceipt.findById(id)
            .populate('branchId', 'name code address')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email')
            .populate('cancelledBy', 'fullName email')
            .populate('items.productId', 'name sku unit salePrice imageUrl')
            .exec();
    }
    async updateImportReceipt(id, data) {
        return importReceipt_model_1.ImportReceipt.findOneAndUpdate({ _id: id, status: 'adjusting' }, {
            $set: {
                ...data,
                status: 'active',
            },
            $unset: { mutationLockedAt: 1 },
        }, { new: true }).exec();
    }
    async cancelImportReceipt(id, cancelledBy) {
        return importReceipt_model_1.ImportReceipt.findOneAndUpdate({ _id: id, status: 'adjusting' }, {
            $set: {
                status: 'cancelled',
                cancelledBy: new mongoose_1.Types.ObjectId(cancelledBy),
                cancelledAt: new Date(),
                updatedBy: new mongoose_1.Types.ObjectId(cancelledBy),
            },
            $unset: { mutationLockedAt: 1 },
        }, { new: true }).exec();
    }
    async findLatestActiveImportCost(branchId, productId, excludeReceiptId) {
        const query = {
            branchId,
            status: { $ne: 'cancelled' },
            'items.productId': productId,
        };
        if (excludeReceiptId)
            query._id = { $ne: excludeReceiptId };
        const receipt = await importReceipt_model_1.ImportReceipt.findOne(query)
            .sort({ createdAt: -1 })
            .select('items')
            .lean()
            .exec();
        const item = receipt?.items.find((entry) => entry.productId.toString() === productId);
        return item?.unitCost;
    }
}
exports.InventoryRepository = InventoryRepository;
exports.inventoryRepository = new InventoryRepository();
//# sourceMappingURL=inventory.repository.js.map