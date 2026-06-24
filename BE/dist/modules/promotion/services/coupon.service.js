"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponService = exports.CouponService = void 0;
const mongoose_1 = require("mongoose");
const promotion_repository_1 = require("../promotion.repository");
const errorHandler_middleware_1 = require("../../../middlewares/errorHandler.middleware");
function generateVoucherCode(prefix = 'VC') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = prefix;
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
function toVoucherResponse(v) {
    return {
        id: v._id.toString(),
        code: v.code,
        promotionId: v.promotionId.toString(),
        discountType: v.discountType,
        discountValue: v.discountValue,
        maxDiscountAmount: v.maxDiscountAmount,
        minOrderAmount: v.minOrderAmount,
        branchId: v.branchId?.toString(),
        expiresAt: v.expiresAt,
        status: v.status,
        usedBy: v.usedBy?.toString(),
        usedAt: v.usedAt,
        createdAt: v.createdAt,
    };
}
class CouponService {
    async generateVouchers(promotionId, quantity, caller) {
        if (quantity < 1 || quantity > 500) {
            throw new errorHandler_middleware_1.AppError('Quantity must be between 1 and 500', 400);
        }
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(promotionId);
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        if (caller.role === 'branch_manager' && promotion.branchId?.toString() !== caller.branchId) {
            throw new errorHandler_middleware_1.AppError('You can only manage promotions of your own branch', 403);
        }
        if (promotion.status === 'expired') {
            throw new errorHandler_middleware_1.AppError('Cannot generate vouchers for an expired promotion', 400);
        }
        if (promotion.status === 'inactive') {
            throw new errorHandler_middleware_1.AppError('Cannot generate vouchers for an inactive promotion', 400);
        }
        if (promotion.usageLimit !== undefined) {
            const existing = await promotion_repository_1.promotionRepository.countActiveVouchersByPromotion(promotionId);
            const remaining = promotion.usageLimit - promotion.usageCount - existing;
            if (quantity > remaining) {
                throw new errorHandler_middleware_1.AppError(`Cannot generate ${quantity} vouchers. Only ${remaining} slots remaining based on usage limit.`, 400);
            }
        }
        const generatedCodes = new Set();
        const maxAttempts = quantity * 5;
        let attempts = 0;
        while (generatedCodes.size < quantity && attempts < maxAttempts) {
            generatedCodes.add(generateVoucherCode('VC'));
            attempts++;
        }
        if (generatedCodes.size < quantity) {
            throw new errorHandler_middleware_1.AppError('Failed to generate unique voucher codes. Please try again.', 500);
        }
        const voucherData = Array.from(generatedCodes).map((code) => ({
            code,
            promotionId: promotion._id,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            maxDiscountAmount: promotion.maxDiscountAmount,
            minOrderAmount: promotion.minOrderAmount,
            branchId: promotion.branchId,
            expiresAt: promotion.endDate,
            status: 'active',
            createdBy: new mongoose_1.Types.ObjectId(caller.userId),
        }));
        const vouchers = await promotion_repository_1.promotionRepository.createManyVouchers(voucherData);
        return {
            message: `${vouchers.length} vouchers generated successfully`,
            data: vouchers.map(toVoucherResponse),
        };
    }
    async listVouchers(promotionId, filter, caller) {
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(promotionId);
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        if (caller.role === 'branch_manager' && promotion.branchId?.toString() !== caller.branchId) {
            throw new errorHandler_middleware_1.AppError('You can only manage promotions of your own branch', 403);
        }
        const { data, total } = await promotion_repository_1.promotionRepository.findVouchersByPromotion({
            promotionId,
            status: filter.status,
            page: filter.page,
            limit: filter.limit,
        });
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 50;
        return {
            data: data.map(toVoucherResponse),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async disableVoucher(voucherId, caller) {
        const voucher = await promotion_repository_1.promotionRepository.findVoucherById(voucherId);
        if (!voucher)
            throw new errorHandler_middleware_1.AppError('Voucher not found', 404);
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(voucher.promotionId.toString());
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        if (caller.role === 'branch_manager' && promotion.branchId?.toString() !== caller.branchId) {
            throw new errorHandler_middleware_1.AppError('You can only manage promotions of your own branch', 403);
        }
        if (voucher.status !== 'active') {
            throw new errorHandler_middleware_1.AppError(`Voucher is already ${voucher.status}`, 400);
        }
        const updated = await promotion_repository_1.promotionRepository.updateVoucherStatus(voucherId, 'disabled');
        return toVoucherResponse(updated);
    }
    async getVoucherResponse(voucher) {
        return toVoucherResponse(voucher);
    }
}
exports.CouponService = CouponService;
exports.couponService = new CouponService();
//# sourceMappingURL=coupon.service.js.map