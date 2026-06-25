"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponService = exports.CouponService = void 0;
const mongoose_1 = require("mongoose");
const promotion_repository_1 = require("../promotion.repository");
const errorHandler_middleware_1 = require("../../../middlewares/errorHandler.middleware");
const voucher_model_1 = require("../../../models/voucher.model");
const user_model_1 = require("../../../models/user.model");
function toVoucherResponse(v) {
    return {
        id: v._id.toString(),
        code: v.code,
        promotionId: v.promotionId.toString(),
        discountType: v.discountType,
        discountValue: v.discountValue,
        maxDiscountAmount: v.maxDiscountAmount,
        minOrderAmount: v.minOrderAmount,
        pointCost: v.pointCost || 0,
        targetMemberLevel: v.targetMemberLevel || 'all',
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
            pointCost: promotion.pointCost || 0,
            targetMemberLevel: promotion.targetMemberLevel || 'all',
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
        // Kiểm tra điều kiện cấp độ thành viên để nhận voucher
        const targetLevel = voucher.targetMemberLevel || 'all';
        if (targetLevel !== 'all') {
            const user = await user_model_1.User.findById(caller.userId).exec();
            if (!user) {
                throw new errorHandler_middleware_1.AppError('Không tìm thấy thông tin người dùng', 404);
            }
            const userLevel = user.memberLevel || 'new';
            const levelRanks = { new: 0, bronze: 1, silver: 2, gold: 3, diamond: 4 };
            const levelNames = { new: 'Mới', bronze: 'Đồng', silver: 'Bạc', gold: 'Vàng', diamond: 'Kim cương' };
            if (targetLevel === 'new') {
                if (userLevel !== 'new') {
                    throw new errorHandler_middleware_1.AppError('Mã giảm giá này chỉ dành riêng cho khách hàng mới', 400);
                }
            }
            else {
                const userRank = levelRanks[userLevel] || 0;
                const requiredRank = levelRanks[targetLevel] || 0;
                if (userRank < requiredRank) {
                    throw new errorHandler_middleware_1.AppError(`Bạn phải đạt cấp độ thành viên ${levelNames[targetLevel]} trở lên để nhận mã này (Hiện tại: ${levelNames[userLevel]})`, 400);
                }
            }
        }
        // Nếu voucher yêu cầu đổi bằng điểm, kiểm tra điểm của user và thực hiện trừ điểm
        if (voucher.pointCost && voucher.pointCost > 0) {
            const user = await user_model_1.User.findById(caller.userId).exec();
            if (!user) {
                throw new errorHandler_middleware_1.AppError('Không tìm thấy thông tin người dùng', 404);
            }
            if ((user.points || 0) < voucher.pointCost) {
                throw new errorHandler_middleware_1.AppError(`Bạn không đủ điểm để đổi mã này (Cần ${voucher.pointCost} điểm, hiện có ${user.points || 0} điểm)`, 400);
            }
            // Khấu trừ điểm của người dùng
            user.points = (user.points || 0) - voucher.pointCost;
            await user.save();
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