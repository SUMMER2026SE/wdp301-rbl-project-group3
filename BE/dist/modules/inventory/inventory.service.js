"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const mongoose_1 = require("mongoose");
const branch_service_1 = require("../branch/branch.service");
const product_service_1 = require("../product/product.service");
const inventory_repository_1 = require("./inventory.repository");
class InventoryService {
    async getInventory(filters) {
        return inventory_repository_1.inventoryRepository.findInventory(filters);
    }
    async createImportReceipt(data) {
        await branch_service_1.branchService.getBranchById(data.branchId);
        const items = [];
        const inventorySnapshots = new Map();
        for (const item of data.items) {
            await product_service_1.productService.ensureProductExists(item.productId);
            items.push({
                productId: new mongoose_1.Types.ObjectId(item.productId),
                quantity: item.quantity,
                unitCost: item.unitCost,
                subtotal: item.quantity * item.unitCost,
            });
        }
        const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0);
        try {
            for (const item of data.items) {
                if (!inventorySnapshots.has(item.productId)) {
                    const current = await inventory_repository_1.inventoryRepository.findInventoryItem(data.branchId, item.productId);
                    inventorySnapshots.set(item.productId, current
                        ? {
                            existed: true,
                            quantity: current.quantity,
                            averageCost: current.averageCost,
                            lastImportCost: current.lastImportCost,
                            lowStockThreshold: current.lowStockThreshold,
                        }
                        : {
                            existed: false,
                            quantity: 0,
                            averageCost: 0,
                            lowStockThreshold: 10,
                        });
                }
                await inventory_repository_1.inventoryRepository.upsertStock({
                    branchId: data.branchId,
                    productId: item.productId,
                    quantityToAdd: item.quantity,
                    unitCost: item.unitCost,
                    updatedBy: data.createdBy,
                });
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
            await this.restoreInventorySnapshots(data.branchId, inventorySnapshots, data.createdBy);
            throw error;
        }
    }
    async getImportReceipts(filters) {
        return inventory_repository_1.inventoryRepository.findImportReceipts(filters);
    }
    generateReceiptCode() {
        const date = new Date();
        const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `IR-${stamp}-${random}`;
    }
    async restoreInventorySnapshots(branchId, snapshots, updatedBy) {
        for (const [productId, snapshot] of snapshots.entries()) {
            if (!snapshot.existed) {
                await inventory_repository_1.inventoryRepository.deleteInventoryItem(branchId, productId);
                continue;
            }
            await inventory_repository_1.inventoryRepository.restoreInventoryItem({
                branchId,
                productId,
                quantity: snapshot.quantity,
                averageCost: snapshot.averageCost,
                lastImportCost: snapshot.lastImportCost,
                lowStockThreshold: snapshot.lowStockThreshold,
                updatedBy,
            });
        }
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
//# sourceMappingURL=inventory.service.js.map