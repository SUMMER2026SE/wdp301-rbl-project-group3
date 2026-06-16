"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionController = exports.PromotionController = void 0;
const promotion_service_1 = require("./promotion.service");
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
            const result = await promotion_service_1.promotionService.listActivePromotions({
                branchId,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            });
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
            const { quantity } = req.body;
            const result = await promotion_service_1.promotionService.generateVouchers(id, quantity, caller);
            (0, response_util_1.sendSuccess)(res, result, result.message, 201);
        });
        this.listVouchers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const id = String(req.params.id);
            const status = queryStr(req.query.status);
            const page = queryStr(req.query.page);
            const limit = queryStr(req.query.limit);
            const result = await promotion_service_1.promotionService.listVouchers(id, {
                status: status,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            }, caller);
            (0, response_util_1.sendSuccess)(res, result, 'Vouchers retrieved');
        });
        this.disableVoucher = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const voucherId = String(req.params.voucherId);
            const result = await promotion_service_1.promotionService.disableVoucher(voucherId, caller);
            (0, response_util_1.sendSuccess)(res, { voucher: result }, 'Voucher disabled');
        });
        // Public — lookup voucher trước khi apply
        this.lookupVoucher = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const code = queryStr(req.query.code) ?? '';
            const result = await promotion_service_1.promotionService.lookupVoucher(code);
            (0, response_util_1.sendSuccess)(res, { voucher: result }, 'Voucher is valid');
        });
    }
}
exports.PromotionController = PromotionController;
exports.promotionController = new PromotionController();
//# sourceMappingURL=promotion.controller.js.map