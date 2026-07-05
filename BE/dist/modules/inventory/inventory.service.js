"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const mongoose_1 = require("mongoose");
const branch_service_1 = require("../branch/branch.service");
const product_service_1 = require("../product/product.service");
const inventory_repository_1 = require("./inventory.repository");
const importReceipt_model_1 = require("../../models/importReceipt.model");
const inventory_model_1 = require("../../models/inventory.model");
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
        for (const item of items) {
            item.verified = false;
        }
        const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0);
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
        const isVerified = lockedReceipt.verificationStatus === 'verified' || lockedReceipt.verificationStatus === 'partially_verified';
        const nextItemsInput = data.items || lockedReceipt.items.map(it => ({
            productId: it.productId.toString(),
            quantity: it.quantity,
            unitCost: it.unitCost
        }));
        let snapshots = new Map();
        try {
            await this.resolveAccessibleBranch(data.actor, currentBranchId);
            await this.resolveAccessibleBranch(data.actor, nextBranchId);
            const preparedItems = await this.prepareItems(nextItemsInput);
            if (isVerified) {
                await this.ensureReceiptStockUnchanged(lockedReceipt);
                const verifiedItems = lockedReceipt.items.filter(it => it.verifiedQuantity && it.verifiedQuantity > 0);
                snapshots = await this.captureInventorySnapshots(verifiedItems.map((item) => ({
                    branchId: currentBranchId,
                    productId: item.productId.toString(),
                })));
                await this.reverseReceiptStock(id, currentBranchId, lockedReceipt.items, data.updatedBy);
            }
            for (const item of preparedItems) {
                item.verified = false;
                item.appliedInventoryQuantity = undefined;
                item.appliedAverageCost = undefined;
            }
            const updated = await importReceipt_model_1.ImportReceipt.findOneAndUpdate({ _id: id, status: 'adjusting' }, {
                $set: {
                    branchId: nextBranchId,
                    supplierName: data.supplierName ?? lockedReceipt.supplierName,
                    note: data.note ?? lockedReceipt.note,
                    items: preparedItems,
                    totalCost: preparedItems.reduce((sum, item) => sum + item.subtotal, 0),
                    updatedBy: new mongoose_1.Types.ObjectId(data.updatedBy),
                    status: 'active',
                    verificationStatus: 'pending',
                },
                $unset: {
                    mutationLockedAt: 1,
                    verifiedBy: 1,
                    verifiedAt: 1,
                    verificationNote: 1,
                },
            }, { new: true }).exec();
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
        const isVerified = lockedReceipt.verificationStatus === 'verified' || lockedReceipt.verificationStatus === 'partially_verified';
        let snapshots = new Map();
        try {
            await this.resolveAccessibleBranch(actor, branchId);
            if (isVerified) {
                await this.ensureReceiptStockUnchanged(lockedReceipt);
                const verifiedItems = lockedReceipt.items.filter(it => it.verifiedQuantity && it.verifiedQuantity > 0);
                snapshots = await this.captureInventorySnapshots(verifiedItems.map((item) => ({ branchId, productId: item.productId.toString() })));
                await this.reverseReceiptStock(id, branchId, lockedReceipt.items, cancelledBy);
            }
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
            const quantityToRemove = item.verifiedQuantity || 0;
            if (quantityToRemove <= 0)
                continue;
            const replacementLastImportCost = await inventory_repository_1.inventoryRepository.findLatestActiveImportCost(branchId, item.productId.toString(), receiptId);
            const updated = await inventory_repository_1.inventoryRepository.reverseImportedStock({
                branchId,
                productId: item.productId.toString(),
                quantityToRemove,
                unitCost: item.unitCost,
                updatedBy,
                replacementLastImportCost,
            });
            if (!updated) {
                throw new errorHandler_middleware_1.AppError(`Cannot reverse imported stock for product ${item.productId.toString()}. The stock may already have been consumed.`, 409);
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
            if (!item.verifiedQuantity || item.verifiedQuantity <= 0)
                continue;
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
    async createInventory(data) {
        await this.resolveAccessibleBranch(data.actor, data.branchId);
        await this.ensureActiveBranch(data.branchId);
        // Verify if product exists and is active
        const product = await product_service_1.productService.ensureProductExists(data.productId);
        if (product.status !== 'active') {
            throw new errorHandler_middleware_1.AppError('Cannot add an inactive product to inventory', 409);
        }
        // Verify that inventory record does not exist yet
        const existing = await inventory_model_1.Inventory.findOne({ branchId: data.branchId, productId: data.productId }).exec();
        if (existing) {
            throw new errorHandler_middleware_1.AppError('Product already exists in this branch\'s inventory', 409);
        }
        return new inventory_model_1.Inventory({
            branchId: data.branchId,
            productId: data.productId,
            quantity: data.quantity,
            averageCost: data.averageCost,
            lastImportCost: data.averageCost > 0 ? data.averageCost : undefined,
            lowStockThreshold: data.lowStockThreshold,
            updatedBy: new mongoose_1.Types.ObjectId(data.createdBy),
        }).save();
    }
    async updateInventory(id, data) {
        const existing = await inventory_model_1.Inventory.findById(id).exec();
        if (!existing) {
            throw new errorHandler_middleware_1.AppError('Inventory record not found', 404);
        }
        await this.resolveAccessibleBranch(data.actor, existing.branchId.toString());
        if (data.quantity !== undefined)
            existing.quantity = data.quantity;
        if (data.averageCost !== undefined)
            existing.averageCost = data.averageCost;
        if (data.lowStockThreshold !== undefined)
            existing.lowStockThreshold = data.lowStockThreshold;
        existing.updatedBy = new mongoose_1.Types.ObjectId(data.updatedBy);
        return existing.save();
    }
    async deleteInventory(id, actor) {
        const existing = await inventory_model_1.Inventory.findById(id).exec();
        if (!existing) {
            throw new errorHandler_middleware_1.AppError('Inventory record not found', 404);
        }
        await this.resolveAccessibleBranch(actor, existing.branchId.toString());
        await inventory_model_1.Inventory.deleteOne({ _id: id }).exec();
    }
    async verifyImportReceipt(id, data) {
        const receipt = await inventory_repository_1.inventoryRepository.findImportReceiptById(id);
        if (!receipt)
            throw new errorHandler_middleware_1.AppError('Import receipt not found', 404);
        await this.resolveAccessibleBranch(data.actor, receipt.branchId.toString());
        if (receipt.verificationStatus && receipt.verificationStatus !== 'pending') {
            throw new errorHandler_middleware_1.AppError('This import receipt has already been verified', 400);
        }
        if (receipt.status === 'cancelled') {
            throw new errorHandler_middleware_1.AppError('Cannot verify a cancelled import receipt', 400);
        }
        const branchId = receipt.branchId.toString();
        const updatedItems = [];
        for (const item of receipt.items) {
            const match = data.verifiedItems.find((vi) => vi.productId === item.productId.toString());
            const rawVQty = match ? match.verifiedQuantity : 0;
            const verifiedQuantity = Math.max(0, Math.min(item.quantity, rawVQty));
            const verified = verifiedQuantity === item.quantity;
            let appliedQty = item.appliedInventoryQuantity;
            let appliedAvgCost = item.appliedAverageCost;
            if (verifiedQuantity > 0) {
                const inventory = await inventory_repository_1.inventoryRepository.upsertStock({
                    branchId,
                    productId: item.productId.toString(),
                    quantityToAdd: verifiedQuantity,
                    unitCost: item.unitCost,
                    updatedBy: data.verifiedBy,
                });
                appliedQty = inventory.quantity;
                appliedAvgCost = inventory.averageCost;
            }
            updatedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                subtotal: item.subtotal,
                appliedInventoryQuantity: appliedQty,
                appliedAverageCost: appliedAvgCost,
                verified,
                verifiedQuantity,
            });
        }
        const allVerified = updatedItems.every((item) => item.verified);
        const verificationStatus = allVerified ? 'verified' : 'partially_verified';
        const result = await inventory_repository_1.inventoryRepository.saveImportReceiptVerification(id, {
            items: updatedItems,
            verificationStatus,
            verifiedBy: data.verifiedBy,
            verifiedAt: new Date(),
            verificationNote: data.note,
        });
        if (!result)
            throw new errorHandler_middleware_1.AppError('Failed to verify import receipt', 500);
        const detailed = await inventory_repository_1.inventoryRepository.findImportReceiptDetail(id);
        if (!detailed)
            throw new errorHandler_middleware_1.AppError('Import receipt detail not found', 500);
        return detailed;
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
//# sourceMappingURL=inventory.service.js.map