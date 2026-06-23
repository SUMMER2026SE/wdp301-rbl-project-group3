"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const mongoose_1 = require("mongoose");
const branch_service_1 = require("../branch/branch.service");
const product_service_1 = require("../product/product.service");
const inventory_repository_1 = require("./inventory.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const user_model_1 = require("../../models/user.model");
class InventoryService {
    async getInventory(filters) {
        const branchId = await this.resolveAccessibleBranch(filters.actor, filters.branchId);
        return inventory_repository_1.inventoryRepository.findInventory({
            branchId,
            productId: filters.productId,
            lowStock: filters.lowStock,
        });
    }
    async createImportReceipt(data) {
        await this.resolveAccessibleBranch(data.actor, data.branchId);
        await this.ensureActiveBranch(data.branchId);
        const items = await this.prepareItems(data.items);
        const inventorySnapshots = await this.captureInventorySnapshots(data.items.map((item) => ({
            branchId: data.branchId,
            productId: item.productId,
        })));
        const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0);
        try {
            for (const item of data.items) {
                const inventory = await inventory_repository_1.inventoryRepository.upsertStock({
                    branchId: data.branchId,
                    productId: item.productId,
                    quantityToAdd: item.quantity,
                    unitCost: item.unitCost,
                    updatedBy: data.createdBy,
                });
                const receiptItem = items.find((entry) => entry.productId.toString() === item.productId);
                if (receiptItem) {
                    receiptItem.appliedInventoryQuantity = inventory.quantity;
                    receiptItem.appliedAverageCost = inventory.averageCost;
                }
            }
            return await inventory_repository_1.inventoryRepository.createImportReceipt({
                code: this.generateReceiptCode(),
                branchId: data.branchId,
                supplierName: data.supplierName,
                note: data.note,
                items,
                totalCost,
                createdBy: data.createdBy,
            });
        }
        catch (error) {
            await this.restoreInventorySnapshots(inventorySnapshots, data.createdBy);
            throw error;
        }
    }
    async getImportReceipts(filters) {
        const branchId = await this.resolveAccessibleBranch(filters.actor, filters.branchId);
        return inventory_repository_1.inventoryRepository.findImportReceipts({
            branchId,
            status: filters.status,
        });
    }
    async getImportReceiptById(id, actor) {
        const rawReceipt = await inventory_repository_1.inventoryRepository.findImportReceiptById(id);
        if (!rawReceipt)
            throw new errorHandler_middleware_1.AppError('Import receipt not found', 404);
        await this.resolveAccessibleBranch(actor, rawReceipt.branchId.toString());
        const receipt = await inventory_repository_1.inventoryRepository.findImportReceiptDetail(id);
        if (!receipt)
            throw new errorHandler_middleware_1.AppError('Import receipt not found', 404);
        return receipt;
    }
    async updateImportReceipt(id, data) {
        const existingReceipt = await inventory_repository_1.inventoryRepository.findImportReceiptById(id);
        if (!existingReceipt)
            throw new errorHandler_middleware_1.AppError('Import receipt not found', 404);
        await this.resolveAccessibleBranch(data.actor, existingReceipt.branchId.toString());
        if (data.branchId) {
            await this.resolveAccessibleBranch(data.actor, data.branchId);
        }
        const receipt = await inventory_repository_1.inventoryRepository.acquireImportReceiptForMutation(id);
        if (!receipt) {
            await this.throwImportReceiptMutationError(id);
        }
        const lockedReceipt = receipt;
        const currentBranchId = lockedReceipt.branchId.toString();
        const nextBranchId = data.branchId || currentBranchId;
        const currentItems = lockedReceipt.items.map((item) => ({
            productId: item.productId.toString(),
            quantity: item.quantity,
            unitCost: item.unitCost,
        }));
        const nextItems = data.items || currentItems;
        let snapshots = new Map();
        try {
            await this.resolveAccessibleBranch(data.actor, currentBranchId);
            await this.resolveAccessibleBranch(data.actor, nextBranchId);
            const preparedItems = await this.prepareItems(nextItems);
            const stockChanged = Boolean(data.branchId || data.items);
            if (stockChanged) {
                await this.ensureActiveBranch(nextBranchId);
                await this.ensureReceiptStockUnchanged(lockedReceipt);
                snapshots = await this.captureInventorySnapshots([
                    ...currentItems.map((item) => ({
                        branchId: currentBranchId,
                        productId: item.productId,
                    })),
                    ...nextItems.map((item) => ({
                        branchId: nextBranchId,
                        productId: item.productId,
                    })),
                ]);
                await this.reverseReceiptStock(id, currentBranchId, currentItems, data.updatedBy);
                const appliedInventory = await this.applyImportedStock(nextBranchId, nextItems, data.updatedBy);
                for (const item of preparedItems) {
                    const inventory = appliedInventory.get(item.productId.toString());
                    if (inventory) {
                        item.appliedInventoryQuantity = inventory.quantity;
                        item.appliedAverageCost = inventory.averageCost;
                    }
                }
            }
            else {
                for (const item of preparedItems) {
                    const currentItem = lockedReceipt.items.find((entry) => entry.productId.toString() === item.productId.toString());
                    item.appliedInventoryQuantity = currentItem?.appliedInventoryQuantity;
                    item.appliedAverageCost = currentItem?.appliedAverageCost;
                }
            }
            const updated = await inventory_repository_1.inventoryRepository.updateImportReceipt(id, {
                branchId: nextBranchId,
                supplierName: data.supplierName ?? lockedReceipt.supplierName,
                note: data.note ?? lockedReceipt.note,
                items: preparedItems,
                totalCost: preparedItems.reduce((sum, item) => sum + item.subtotal, 0),
                updatedBy: data.updatedBy,
            });
            if (!updated)
                throw new errorHandler_middleware_1.AppError('Import receipt update conflict', 409);
            return (await inventory_repository_1.inventoryRepository.findImportReceiptDetail(id)) || updated;
        }
        catch (error) {
            if (snapshots.size > 0) {
                await this.restoreInventorySnapshots(snapshots, data.updatedBy);
            }
            await inventory_repository_1.inventoryRepository.releaseImportReceiptMutation(id);
            throw error;
        }
    }
    async cancelImportReceipt(id, cancelledBy, actor) {
        const existingReceipt = await inventory_repository_1.inventoryRepository.findImportReceiptById(id);
        if (!existingReceipt)
            throw new errorHandler_middleware_1.AppError('Import receipt not found', 404);
        await this.resolveAccessibleBranch(actor, existingReceipt.branchId.toString());
        const receipt = await inventory_repository_1.inventoryRepository.acquireImportReceiptForMutation(id);
        if (!receipt) {
            await this.throwImportReceiptMutationError(id);
        }
        const lockedReceipt = receipt;
        const branchId = lockedReceipt.branchId.toString();
        const items = lockedReceipt.items.map((item) => ({
            productId: item.productId.toString(),
            quantity: item.quantity,
            unitCost: item.unitCost,
        }));
        let snapshots = new Map();
        try {
            await this.resolveAccessibleBranch(actor, branchId);
            await this.ensureReceiptStockUnchanged(lockedReceipt);
            snapshots = await this.captureInventorySnapshots(items.map((item) => ({ branchId, productId: item.productId })));
            await this.reverseReceiptStock(id, branchId, items, cancelledBy);
            const cancelled = await inventory_repository_1.inventoryRepository.cancelImportReceipt(id, cancelledBy);
            if (!cancelled)
                throw new errorHandler_middleware_1.AppError('Import receipt cancellation conflict', 409);
            return (await inventory_repository_1.inventoryRepository.findImportReceiptDetail(id)) || cancelled;
        }
        catch (error) {
            if (snapshots.size > 0) {
                await this.restoreInventorySnapshots(snapshots, cancelledBy);
            }
            await inventory_repository_1.inventoryRepository.releaseImportReceiptMutation(id);
            throw error;
        }
    }
    generateReceiptCode() {
        const date = new Date();
        const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `IR-${stamp}-${random}`;
    }
    async prepareItems(items) {
        const preparedItems = [];
        for (const item of items) {
            const product = await product_service_1.productService.ensureProductExists(item.productId);
            if (product.status !== 'active') {
                throw new errorHandler_middleware_1.AppError(`Inactive product ${item.productId} cannot be imported`, 409);
            }
            preparedItems.push({
                productId: new mongoose_1.Types.ObjectId(item.productId),
                quantity: item.quantity,
                unitCost: item.unitCost,
                subtotal: item.quantity * item.unitCost,
            });
        }
        return preparedItems;
    }
    async applyImportedStock(branchId, items, updatedBy) {
        const appliedInventory = new Map();
        for (const item of items) {
            const inventory = await inventory_repository_1.inventoryRepository.upsertStock({
                branchId,
                productId: item.productId,
                quantityToAdd: item.quantity,
                unitCost: item.unitCost,
                updatedBy,
            });
            appliedInventory.set(item.productId, inventory);
        }
        return appliedInventory;
    }
    async reverseReceiptStock(receiptId, branchId, items, updatedBy) {
        for (const item of items) {
            const replacementLastImportCost = await inventory_repository_1.inventoryRepository.findLatestActiveImportCost(branchId, item.productId, receiptId);
            const updated = await inventory_repository_1.inventoryRepository.reverseImportedStock({
                branchId,
                productId: item.productId,
                quantityToRemove: item.quantity,
                unitCost: item.unitCost,
                updatedBy,
                replacementLastImportCost,
            });
            if (!updated) {
                throw new errorHandler_middleware_1.AppError(`Cannot reverse imported stock for product ${item.productId}. The stock may already have been consumed.`, 409);
            }
        }
    }
    async captureInventorySnapshots(locations) {
        const snapshots = new Map();
        for (const location of locations) {
            const key = `${location.branchId}:${location.productId}`;
            if (snapshots.has(key))
                continue;
            const current = await inventory_repository_1.inventoryRepository.findInventoryItem(location.branchId, location.productId);
            snapshots.set(key, {
                branchId: location.branchId,
                productId: location.productId,
                existed: Boolean(current),
                quantity: current?.quantity || 0,
                averageCost: current?.averageCost || 0,
                lastImportCost: current?.lastImportCost,
                lowStockThreshold: current?.lowStockThreshold || 10,
            });
        }
        return snapshots;
    }
    async restoreInventorySnapshots(snapshots, updatedBy) {
        for (const snapshot of snapshots.values()) {
            if (!snapshot.existed) {
                await inventory_repository_1.inventoryRepository.deleteInventoryItem(snapshot.branchId, snapshot.productId);
                continue;
            }
            await inventory_repository_1.inventoryRepository.restoreInventoryItem({
                branchId: snapshot.branchId,
                productId: snapshot.productId,
                quantity: snapshot.quantity,
                averageCost: snapshot.averageCost,
                lastImportCost: snapshot.lastImportCost,
                lowStockThreshold: snapshot.lowStockThreshold,
                updatedBy,
            });
        }
    }
    async throwImportReceiptMutationError(id) {
        const existing = await inventory_repository_1.inventoryRepository.findImportReceiptById(id);
        if (!existing)
            throw new errorHandler_middleware_1.AppError('Import receipt not found', 404);
        if (existing.status === 'cancelled') {
            throw new errorHandler_middleware_1.AppError('Cancelled import receipts cannot be modified', 409);
        }
        throw new errorHandler_middleware_1.AppError('Import receipt is being modified by another request', 409);
    }
    async ensureActiveBranch(branchId) {
        const branch = await branch_service_1.branchService.getBranchById(branchId);
        if (branch.status !== 'active') {
            throw new errorHandler_middleware_1.AppError('Cannot import stock into an inactive branch', 409);
        }
    }
    async resolveAccessibleBranch(actor, requestedBranchId) {
        if (actor.role === 'admin')
            return requestedBranchId;
        const user = await user_model_1.User.findById(actor.userId)
            .select('branchId status')
            .lean()
            .exec();
        if (!user || user.status !== 'active') {
            throw new errorHandler_middleware_1.AppError('Active staff account required', 403);
        }
        if (!user.branchId) {
            throw new errorHandler_middleware_1.AppError('No branch is assigned to this account', 403);
        }
        const assignedBranchId = user.branchId.toString();
        if (requestedBranchId && requestedBranchId !== assignedBranchId) {
            throw new errorHandler_middleware_1.AppError('You cannot access another branch', 403);
        }
        return assignedBranchId;
    }
    async ensureReceiptStockUnchanged(receipt) {
        const branchId = receipt.branchId.toString();
        for (const item of receipt.items) {
            if (item.appliedInventoryQuantity === undefined ||
                item.appliedAverageCost === undefined) {
                throw new errorHandler_middleware_1.AppError('This legacy import receipt cannot safely change stock because no inventory checkpoint is available', 409);
            }
            const inventory = await inventory_repository_1.inventoryRepository.findInventoryItem(branchId, item.productId.toString());
            const averageCostMatches = inventory &&
                Math.abs(inventory.averageCost - item.appliedAverageCost) < 0.000001;
            if (!inventory ||
                inventory.quantity !== item.appliedInventoryQuantity ||
                !averageCostMatches) {
                throw new errorHandler_middleware_1.AppError(`Import receipt cannot be modified because inventory for product ${item.productId.toString()} has changed`, 409);
            }
        }
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
//# sourceMappingURL=inventory.service.js.map