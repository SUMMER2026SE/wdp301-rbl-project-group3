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
    async createImportReceipt(data) {
        return new importReceipt_model_1.ImportReceipt(data).save();
    }
    async findImportReceipts(filters) {
        const query = {};
        if (filters.branchId)
            query.branchId = filters.branchId;
        return importReceipt_model_1.ImportReceipt.find(query)
            .populate('branchId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('items.productId', 'name sku unit')
            .sort({ createdAt: -1 })
            .exec();
    }
}
exports.InventoryRepository = InventoryRepository;
exports.inventoryRepository = new InventoryRepository();
//# sourceMappingURL=inventory.repository.js.map