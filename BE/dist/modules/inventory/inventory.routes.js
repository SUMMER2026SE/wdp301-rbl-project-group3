"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("./inventory.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const inventory_validation_1 = require("./inventory.validation");
const router = (0, express_1.Router)();
const backOfficeRoles = ['admin', 'branch_manager', 'staff'];
router.use(auth_middleware_1.authenticate);
router.use((0, role_middleware_1.authorize)(...backOfficeRoles));
// Inventory Report / Manual stock CRUD
router.get('/', (0, inventory_validation_1.validate)(inventory_validation_1.listInventorySchema), inventory_controller_1.inventoryController.getInventory);
router.post('/', (0, inventory_validation_1.validate)(inventory_validation_1.createInventorySchema), inventory_controller_1.inventoryController.createInventory);
router.patch('/:id', (0, inventory_validation_1.validate)(inventory_validation_1.updateInventorySchema), inventory_controller_1.inventoryController.updateInventory);
router.delete('/:id', (0, inventory_validation_1.validate)(inventory_validation_1.inventoryIdParamSchema), inventory_controller_1.inventoryController.deleteInventory);
// Import history and receipts CRUD
router.get('/import-receipts', (0, inventory_validation_1.validate)(inventory_validation_1.listImportReceiptsSchema), inventory_controller_1.inventoryController.getImportReceipts);
router.post('/import-receipts', (0, inventory_validation_1.validate)(inventory_validation_1.createImportReceiptSchema), inventory_controller_1.inventoryController.createImportReceipt);
router.get('/import-receipts/:id', (0, inventory_validation_1.validate)(inventory_validation_1.importReceiptIdParamSchema), inventory_controller_1.inventoryController.getImportReceiptById);
router.patch('/import-receipts/:id', (0, inventory_validation_1.validate)(inventory_validation_1.updateImportReceiptSchema), inventory_controller_1.inventoryController.updateImportReceipt);
router.delete('/import-receipts/:id', (0, inventory_validation_1.validate)(inventory_validation_1.importReceiptIdParamSchema), inventory_controller_1.inventoryController.cancelImportReceipt);
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map