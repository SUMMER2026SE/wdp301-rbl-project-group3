"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const flash_sale_controller_1 = require("./flash-sale.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const flash_sale_validation_1 = require("./flash-sale.validation");
const router = (0, express_1.Router)();
// ─── Public ──────────────────────────────────────────────────────────────────
router.get('/active', flash_sale_controller_1.flashSaleController.getActiveFlashSale);
// ─── Back-Office ─────────────────────────────────────────────────────────────
router.get('/', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager', 'staff'), (0, flash_sale_validation_1.validate)(flash_sale_validation_1.listFlashSalesSchema), flash_sale_controller_1.flashSaleController.listFlashSales);
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, flash_sale_validation_1.validate)(flash_sale_validation_1.createFlashSaleSchema), flash_sale_controller_1.flashSaleController.createFlashSale);
router.get('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager', 'staff'), (0, flash_sale_validation_1.validate)(flash_sale_validation_1.flashSaleIdParamSchema), flash_sale_controller_1.flashSaleController.getFlashSale);
router.put('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, flash_sale_validation_1.validate)(flash_sale_validation_1.updateFlashSaleSchema), flash_sale_controller_1.flashSaleController.updateFlashSale);
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, flash_sale_validation_1.validate)(flash_sale_validation_1.flashSaleIdParamSchema), flash_sale_controller_1.flashSaleController.deleteFlashSale);
exports.default = router;
//# sourceMappingURL=flash-sale.routes.js.map