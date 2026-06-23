"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponService = exports.CouponService = void 0;
const mongoose_1 = require("mongoose");
const promotion_repository_1 = require("../promotion.repository");
const errorHandler_middleware_1 = require("../../../middlewares/errorHandler.middleware");
const voucher_model_1 = require("../../../models/voucher.model");
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
    async generateVouchers(promotionId, code, caller) {
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
        const normalizedCode = code.trim().toUpperCase();
        const exists = await promotion_repository_1.promotionRepository.findVoucherByCode(normalizedCode);
        if (exists) {
            throw new errorHandler_middleware_1.AppError(`Voucher code "${normalizedCode}" already exists`, 400);
        }
        const voucherData = {
            code: normalizedCode,
            promotionId: promotion._id,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            maxDiscountAmount: promotion.maxDiscountAmount,
            minOrderAmount: promotion.minOrderAmount,
            branchId: promotion.branchId,
            expiresAt: promotion.endDate,
            status: 'active',
            createdBy: new mongoose_1.Types.ObjectId(caller.userId),
        };
        const voucher = await promotion_repository_1.promotionRepository.createVoucher(voucherData);
        return {
            message: `Voucher "${normalizedCode}" created successfully`,
            data: toVoucherResponse(voucher),
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
    async claimVoucher(code, caller) {
        const normalizedCode = code.trim().toUpperCase();
        const voucher = await voucher_model_1.Voucher.findOne({ code: normalizedCode }).exec();
        if (!voucher) {
            throw new errorHandler_middleware_1.AppError('Mã giảm giá không tồn tại hoặc không hợp lệ', 404);
        }
        if (voucher.status === 'disabled') {
            throw new errorHandler_middleware_1.AppError('Mã giảm giá này đã bị vô hiệu hóa', 400);
        }
        if (voucher.expiresAt < new Date()) {
            throw new errorHandler_middleware_1.AppError('Mã giảm giá này đã hết hạn', 400);
        }
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(voucher.promotionId.toString());
        if (!promotion || promotion.status !== 'active') {
            throw new errorHandler_middleware_1.AppError('Chương trình khuyến mãi này đã kết thúc hoặc không khả dụng', 400);
        }
        // Kiểm tra xem người dùng đã claim mã này chưa
        const alreadyClaimed = voucher.claims?.some((c) => c.userId.toString() === caller.userId);
        if (alreadyClaimed) {
            throw new errorHandler_middleware_1.AppError('Bạn đã nhận mã giảm giá này rồi', 400);
        }
        // Push claim mới vào mảng claims
        voucher.claims = voucher.claims || [];
        voucher.claims.push({
            userId: new mongoose_1.Types.ObjectId(caller.userId),
            status: 'active',
            claimedAt: new Date(),
        });
        await voucher.save();
        return {
            message: 'Nhận mã giảm giá thành công',
            code: voucher.code,
        };
    }
    async getVoucherResponse(voucher) {
        return toVoucherResponse(voucher);
    }
}
exports.CouponService = CouponService;
exports.couponService = new CouponService();
//# sourceMappingURL=coupon.service.js.map