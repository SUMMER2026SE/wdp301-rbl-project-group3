"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionUsageService = exports.PromotionUsageService = void 0;
const promotion_repository_1 = require("../promotion.repository");
const errorHandler_middleware_1 = require("../../../middlewares/errorHandler.middleware");
class PromotionUsageService {
    /**
     * Đánh dấu voucher là đã sử dụng, gắn với user và order, đồng thời tăng usageCount của promotion
     */
    async applyVoucher(voucherId, userId, orderId) {
        const voucher = await promotion_repository_1.promotionRepository.findVoucherById(voucherId);
        if (!voucher)
            throw new errorHandler_middleware_1.AppError('Voucher not found', 404);
        if (voucher.status !== 'active') {
            throw new errorHandler_middleware_1.AppError(`Voucher cannot be used because its status is ${voucher.status}`, 400);
        }
        const updatedVoucher = await promotion_repository_1.promotionRepository.markVoucherUsedWithOrder(voucherId, userId, orderId);
        if (updatedVoucher) {
            await promotion_repository_1.promotionRepository.incrementUsageCount(voucher.promotionId.toString());
        }
        return updatedVoucher;
    }
}
exports.PromotionUsageService = PromotionUsageService;
exports.promotionUsageService = new PromotionUsageService();
//# sourceMappingURL=usage.service.js.map