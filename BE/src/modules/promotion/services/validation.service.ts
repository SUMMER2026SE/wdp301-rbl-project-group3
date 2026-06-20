import { promotionRepository } from '../promotion.repository';
import { IVoucher } from '../../../models/voucher.model';
import { AppError } from '../../../middlewares/errorHandler.middleware';

export class PromotionValidationService {
  /**
   * Kiểm tra tính hợp lệ của mã giảm giá
   */
  async validateVoucher(code: string, orderValue: number, branchId?: string): Promise<IVoucher> {
    const voucher = await promotionRepository.findVoucherByCode(code);
    
    if (!voucher) {
      throw new AppError('Voucher does not exist or invalid code', 404);
    }

    if (voucher.status === 'disabled') {
      throw new AppError('This voucher has been disabled', 400);
    }

    if (voucher.status === 'used') {
      throw new AppError('This voucher has already been used', 400);
    }

    if (voucher.status === 'expired' || voucher.expiresAt < new Date()) {
      if (voucher.status !== 'expired') {
        await promotionRepository.updateVoucherStatus(voucher._id.toString(), 'expired');
      }
      throw new AppError('This voucher has expired', 400);
    }

    const promotion = await promotionRepository.findPromotionById(voucher.promotionId.toString());
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }

    if (promotion.status !== 'active') {
      throw new AppError(`Promotion is currently ${promotion.status}`, 400);
    }

    if (promotion.startDate > new Date()) {
      throw new AppError('Promotion has not started yet', 400);
    }

    // Kiểm tra usageLimit của promotion
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      throw new AppError('Promotion usage limit reached', 400);
    }

    // Kiểm tra branchId nếu voucher/promotion bị giới hạn chi nhánh
    if (voucher.branchId && branchId && voucher.branchId.toString() !== branchId) {
      throw new AppError('This voucher cannot be used at the current branch', 400);
    }

    // Kiểm tra minimum order amount
    if (voucher.minOrderAmount && orderValue < voucher.minOrderAmount) {
      throw new AppError(`Minimum order amount required is ${voucher.minOrderAmount}`, 400);
    }

    return voucher;
  }
}

export const promotionValidationService = new PromotionValidationService();
