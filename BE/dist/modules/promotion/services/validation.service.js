"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionValidationService = exports.PromotionValidationService = void 0;
const promotion_repository_1 = require("../promotion.repository");
const errorHandler_middleware_1 = require("../../../middlewares/errorHandler.middleware");
class PromotionValidationService {
    /**
     * Kiểm tra tính hợp lệ của mã giảm giá
     */
    async validateVoucher(code, orderValue, branchId, userId) {
        const voucher = await promotion_repository_1.promotionRepository.findVoucherByCode(code);
        if (!voucher) {
            throw new errorHandler_middleware_1.AppError('Voucher does not exist or invalid code', 404);
        }
        if (voucher.status === 'disabled') {
            throw new errorHandler_middleware_1.AppError('This voucher has been disabled', 400);
        }
        if (voucher.status === 'expired' || voucher.expiresAt < new Date()) {
            if (voucher.status !== 'expired') {
                await promotion_repository_1.promotionRepository.updateVoucherStatus(voucher._id.toString(), 'expired');
            }
            throw new errorHandler_middleware_1.AppError('This voucher has expired', 400);
        }
        if (userId) {
            const userClaim = voucher.claims?.find((c) => c.userId.toString() === userId);
            if (!userClaim) {
                throw new errorHandler_middleware_1.AppError('Bạn chưa nhận mã giảm giá này. Hãy vào mục Khuyến Mãi để nhận mã!', 400);
            }
            if (userClaim.status === 'used') {
                throw new errorHandler_middleware_1.AppError('Bạn đã sử dụng mã giảm giá này rồi', 400);
            }
        }
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(voucher.promotionId.toString());
        if (!promotion) {
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        }
        if (promotion.status !== 'active') {
            throw new errorHandler_middleware_1.AppError(`Promotion is currently ${promotion.status}`, 400);
        }
        if (promotion.startDate > new Date()) {
            throw new errorHandler_middleware_1.AppError('Promotion has not started yet', 400);
        }
        // Kiểm tra usageLimit của promotion
        if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
            throw new errorHandler_middleware_1.AppError('Promotion usage limit reached', 400);
        }
        // Kiểm tra branchId nếu voucher/promotion bị giới hạn chi nhánh
        if (voucher.branchId && branchId && voucher.branchId.toString() !== branchId) {
            throw new errorHandler_middleware_1.AppError('This voucher cannot be used at the current branch', 400);
        }
        // Kiểm tra minimum order amount
        if (voucher.minOrderAmount && orderValue < voucher.minOrderAmount) {
            throw new errorHandler_middleware_1.AppError(`Minimum order amount required is ${voucher.minOrderAmount}`, 400);
        }
        return voucher;
    }
}
exports.PromotionValidationService = PromotionValidationService;
exports.promotionValidationService = new PromotionValidationService();
//# sourceMappingURL=validation.service.js.map