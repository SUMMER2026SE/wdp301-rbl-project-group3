import { promotionRepository } from '../promotion.repository';
import { AppError } from '../../../middlewares/errorHandler.middleware';
import { Types } from 'mongoose';

export class PromotionUsageService {
  /**
   * Đánh dấu voucher là đã sử dụng, gắn với user và order, đồng thời tăng usageCount của promotion
   */
  async applyVoucher(voucherId: string, userId: string, orderId: string) {
    const voucher = await promotionRepository.findVoucherById(voucherId);
    if (!voucher) throw new AppError('Voucher not found', 404);

    if (voucher.status !== 'active') {
      throw new AppError(`Voucher cannot be used because its status is ${voucher.status}`, 400);
    }

    const updatedVoucher = await promotionRepository.markVoucherUsedWithOrder(voucherId, userId, orderId);
    if (updatedVoucher) {
      await promotionRepository.incrementUsageCount(voucher.promotionId.toString());
    }
    
    return updatedVoucher;
  }
}

export const promotionUsageService = new PromotionUsageService();
