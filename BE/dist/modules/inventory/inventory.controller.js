"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.InventoryController = void 0;
const inventory_service_1 = require("./inventory.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class InventoryController {
    constructor() {
        this.getInventory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const inventory = await inventory_service_1.inventoryService.getInventory({
                branchId: req.query.branchId,
                productId: req.query.productId,
                lowStock: req.query.lowStock === 'true',
                actor: {
                    userId: req.user.userId,
                    role: req.user.role,
                },
            });
            (0, response_util_1.sendSuccess)(res, { inventory }, 'Inventory retrieved');
        });
        this.createImportReceipt = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const receipt = await inventory_service_1.inventoryService.createImportReceipt({
                ...req.body,
                createdBy: req.user.userId,
                actor: {
                    userId: req.user.userId,
                    role: req.user.role,
                },
            });
            (0, response_util_1.sendSuccess)(res, { receipt }, 'Import receipt created and stock updated', 201);
        });
        this.getImportReceipts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const receipts = await inventory_service_1.inventoryService.getImportReceipts({
                branchId: req.query.branchId,
                status: req.query.status,
                actor: {
                    userId: req.user.userId,
                    role: req.user.role,
                },
            });
            (0, response_util_1.sendSuccess)(res, { receipts }, 'Import receipts retrieved');
        });
        this.getImportReceiptById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const receipt = await inventory_service_1.inventoryService.getImportReceiptById(String(req.params.id), {
                userId: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(res, { receipt }, 'Import receipt retrieved');
        });
        this.updateImportReceipt = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const receipt = await inventory_service_1.inventoryService.updateImportReceipt(String(req.params.id), {
                ...req.body,
                updatedBy: req.user.userId,
                actor: {
                    userId: req.user.userId,
                    role: req.user.role,
                },
            });
            (0, response_util_1.sendSuccess)(res, { receipt }, 'Import receipt updated and stock reconciled');
        });
        this.cancelImportReceipt = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const receipt = await inventory_service_1.inventoryService.cancelImportReceipt(String(req.params.id), req.user.userId, {
                userId: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(res, { receipt }, 'Import receipt cancelled and stock reversed');
        });
    }
}
exports.InventoryController = InventoryController;
exports.inventoryController = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map