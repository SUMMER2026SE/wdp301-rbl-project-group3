"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("./inventory.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const inventory_validation_1 = require("./inventory.validation");
const router = (0, express_1.Router)();
const backOfficeRoles = ['superadmin', 'admin', 'manager', 'staff'];
router.use(auth_middleware_1.authenticate);
router.use((0, role_middleware_1.authorize)(...backOfficeRoles));
router.get('/', (0, inventory_validation_1.validate)(inventory_validation_1.listInventorySchema), inventory_controller_1.inventoryController.getInventory);
router.get('/import-receipts', (0, inventory_validation_1.validate)(inventory_validation_1.listImportReceiptsSchema), inventory_controller_1.inventoryController.getImportReceipts);
router.post('/import-receipts', (0, inventory_validation_1.validate)(inventory_validation_1.createImportReceiptSchema), inventory_controller_1.inventoryController.createImportReceipt);
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map