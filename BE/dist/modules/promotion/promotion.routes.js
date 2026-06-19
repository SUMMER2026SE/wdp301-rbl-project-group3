"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promotion_controller_1 = require("./promotion.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const promotion_validation_1 = require("./promotion.validation");
const router = (0, express_1.Router)();
// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/active', (0, promotion_validation_1.validate)(promotion_validation_1.listActivePromotionsSchema), promotion_controller_1.promotionController.listActivePromotions);
router.get('/vouchers/lookup', (0, promotion_validation_1.validate)(promotion_validation_1.lookupVoucherSchema), promotion_controller_1.promotionController.lookupVoucher);
// ─── Admin & Branch Manager ───────────────────────────────────────────────────
router.get('/', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, promotion_validation_1.validate)(promotion_validation_1.listPromotionsSchema), promotion_controller_1.promotionController.listPromotions);
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, promotion_validation_1.validate)(promotion_validation_1.createPromotionSchema), promotion_controller_1.promotionController.createPromotion);
router.get('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, promotion_validation_1.validate)(promotion_validation_1.promotionIdParamSchema), promotion_controller_1.promotionController.getPromotion);
router.patch('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, promotion_validation_1.validate)(promotion_validation_1.updatePromotionSchema), promotion_controller_1.promotionController.updatePromotion);
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, promotion_validation_1.validate)(promotion_validation_1.promotionIdParamSchema), promotion_controller_1.promotionController.deletePromotion);
router.patch('/:id/activate', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, promotion_validation_1.validate)(promotion_validation_1.promotionIdParamSchema), promotion_controller_1.promotionController.activatePromotion);
router.patch('/:id/deactivate', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, promotion_validation_1.validate)(promotion_validation_1.promotionIdParamSchema), promotion_controller_1.promotionController.deactivatePromotion);
// ─── Vouchers ─────────────────────────────────────────────────────────────────
router.post('/:id/vouchers/generate', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, promotion_validation_1.validate)(promotion_validation_1.generateVouchersSchema), promotion_controller_1.promotionController.generateVouchers);
router.get('/:id/vouchers', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, promotion_validation_1.validate)(promotion_validation_1.listVouchersSchema), promotion_controller_1.promotionController.listVouchers);
router.patch('/vouchers/:voucherId/disable', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, promotion_validation_1.validate)(promotion_validation_1.voucherIdParamSchema), promotion_controller_1.promotionController.disableVoucher);
exports.default = router;
//# sourceMappingURL=promotion.routes.js.map