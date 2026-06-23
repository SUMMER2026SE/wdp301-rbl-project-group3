"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionController = exports.PromotionController = void 0;
const promotion_service_1 = require("./services/promotion.service");
const coupon_service_1 = require("./services/coupon.service");
const validation_service_1 = require("./services/validation.service");
const calculation_service_1 = require("./services/calculation.service");
const usage_service_1 = require("./services/usage.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const user_model_1 = require("../../models/user.model");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
async function buildCallerContext(req) {
    const { userId, role } = req.user;
    if (role === 'branch_manager') {
        const user = await user_model_1.User.findById(userId).select('branchId').exec();
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        return { userId, role, branchId: user.branchId?.toString() };
    }
    return { userId, role };
}
// Helper: lấy 1 query param dạng string an toàn
function queryStr(value) {
    if (Array.isArray(value))
        return value[0];
    if (typeof value === 'string')
        return value;
    return undefined;
}
class PromotionController {
    constructor() {
        // ─── Promotion CRUD ────────────────────────────────────────────────────────
        this.createPromotion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const result = await promotion_service_1.promotionService.createPromotion(req.body, caller);
            (0, response_util_1.sendSuccess)(res, { promotion: result }, 'Promotion created successfully', 201);
        });
        this.listPromotions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const status = queryStr(req.query.status);
            const scope = queryStr(req.query.scope);
            const branchId = queryStr(req.query.branchId);
            const page = queryStr(req.query.page);
            const limit = queryStr(req.query.limit);
            const result = await promotion_service_1.promotionService.listPromotions({
                status: status,
                scope: scope,
                branchId,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            }, caller);
            (0, response_util_1.sendSuccess)(res, result, 'Promotions retrieved');
        });
        // Public — staff/customer xem promotion đang active
        this.listActivePromotions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const branchId = queryStr(req.query.branchId);
            const page = queryStr(req.query.page);
            const limit = queryStr(req.query.limit);
            const onlyClaimed = queryStr(req.query.onlyClaimed) === 'true';
            const caller = await buildCallerContext(req);
            const result = await promotion_service_1.promotionService.listActivePromotions({
                branchId,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                onlyClaimed,
            }, caller);
            (0, response_util_1.sendSuccess)(res, result, 'Active promotions retrieved');
        });
        this.getPromotion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const id = String(req.params.id);
            const result = await promotion_service_1.promotionService.getPromotion(id, caller);
            (0, response_util_1.sendSuccess)(res, { promotion: result }, 'Promotion retrieved');
        });
        this.updatePromotion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const id = String(req.params.id);
            const result = await promotion_service_1.promotionService.updatePromotion(id, req.body, caller);
            (0, response_util_1.sendSuccess)(res, { promotion: result }, 'Promotion updated');
        });
        this.deletePromotion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const id = String(req.params.id);
            const result = await promotion_service_1.promotionService.deletePromotion(id, caller);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
        this.activatePromotion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const id = String(req.params.id);
            const result = await promotion_service_1.promotionService.activatePromotion(id, caller);
            (0, response_util_1.sendSuccess)(res, { promotion: result }, 'Promotion activated');
        });
        this.deactivatePromotion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const id = String(req.params.id);
            const result = await promotion_service_1.promotionService.deactivatePromotion(id, caller);
            (0, response_util_1.sendSuccess)(res, { promotion: result }, 'Promotion deactivated');
        });
        // ─── Voucher ───────────────────────────────────────────────────────────────
        this.generateVouchers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const id = String(req.params.id);
            const { code } = req.body;
            const result = await coupon_service_1.couponService.generateVouchers(id, code, caller);
            (0, response_util_1.sendSuccess)(res, result, result.message, 201);
        });
        this.listVouchers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const id = String(req.params.id);
            const status = queryStr(req.query.status);
            const page = queryStr(req.query.page);
            const limit = queryStr(req.query.limit);
            const result = await coupon_service_1.couponService.listVouchers(id, {
                status: status,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            }, caller);
            (0, response_util_1.sendSuccess)(res, result, 'Vouchers retrieved');
        });
        this.disableVoucher = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const voucherId = String(req.params.voucherId);
            const result = await coupon_service_1.couponService.disableVoucher(voucherId, caller);
            (0, response_util_1.sendSuccess)(res, { voucher: result }, 'Voucher disabled');
        });
        // Public — lookup voucher trước khi apply (validate và calculate discount)
        this.lookupVoucher = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const code = queryStr(req.query.code) ?? '';
            const orderValue = Number(queryStr(req.query.orderValue)) || 0;
            const branchId = queryStr(req.query.branchId);
            const caller = await buildCallerContext(req).catch(() => null);
            const userId = caller?.userId;
            const voucher = await validation_service_1.promotionValidationService.validateVoucher(code, orderValue, branchId, userId);
            const discount = calculation_service_1.promotionCalculationService.calculateDiscount(voucher, orderValue);
            const response = await coupon_service_1.couponService.getVoucherResponse(voucher);
            (0, response_util_1.sendSuccess)(res, { voucher: response, discountAmount: discount }, 'Voucher is valid');
        });
        // Áp dụng voucher thực tế (khi thanh toán/tạo đơn hàng)
        this.applyVoucher = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { userId } = await buildCallerContext(req);
            const code = req.body.code;
            const orderValue = Number(req.body.orderValue) || 0;
            const branchId = req.body.branchId;
            const orderId = req.body.orderId;
            if (!orderId) {
                throw new errorHandler_middleware_1.AppError('orderId is required to apply voucher', 400);
            }
            const voucher = await validation_service_1.promotionValidationService.validateVoucher(code, orderValue, branchId, userId);
            const discount = calculation_service_1.promotionCalculationService.calculateDiscount(voucher, orderValue);
            const updatedVoucher = await usage_service_1.promotionUsageService.applyVoucher(voucher._id.toString(), userId, orderId);
            const response = await coupon_service_1.couponService.getVoucherResponse(updatedVoucher);
            (0, response_util_1.sendSuccess)(res, { voucher: response, discountAmount: discount }, 'Voucher applied successfully');
        });
        this.claimVoucher = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const { code } = req.body;
            const result = await coupon_service_1.couponService.claimVoucher(code, caller);
            (0, response_util_1.sendSuccess)(res, result, 'Voucher claimed successfully');
        });
    }
}
exports.PromotionController = PromotionController;
exports.promotionController = new PromotionController();
//# sourceMappingURL=promotion.controller.js.map