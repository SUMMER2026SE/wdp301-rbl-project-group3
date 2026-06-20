import { Types } from 'mongoose';
import { promotionRepository } from '../promotion.repository';
import { CallerContext } from '../types';
import { AppError } from '../../../middlewares/errorHandler.middleware';
import { IVoucher } from '../../../models/voucher.model';

function generateVoucherCode(prefix = 'VC'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix;
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function toVoucherResponse(v: IVoucher) {
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

export class CouponService {
  async generateVouchers(promotionId: string, quantity: number, caller: CallerContext) {
    if (quantity < 1 || quantity > 500) {
      throw new AppError('Quantity must be between 1 and 500', 400);
    }

    const promotion = await promotionRepository.findPromotionById(promotionId);
    if (!promotion) throw new AppError('Promotion not found', 404);

    if (caller.role === 'branch_manager' && promotion.branchId?.toString() !== caller.branchId) {
      throw new AppError('You can only manage promotions of your own branch', 403);
    }

    if (promotion.status === 'expired') {
      throw new AppError('Cannot generate vouchers for an expired promotion', 400);
    }

    if (promotion.status === 'inactive') {
      throw new AppError('Cannot generate vouchers for an inactive promotion', 400);
    }

    if (promotion.usageLimit !== undefined) {
      const existing = await promotionRepository.countActiveVouchersByPromotion(promotionId);
      const remaining = promotion.usageLimit - promotion.usageCount - existing;
      if (quantity > remaining) {
        throw new AppError(
          `Cannot generate ${quantity} vouchers. Only ${remaining} slots remaining based on usage limit.`,
          400
        );
      }
    }

    const generatedCodes = new Set<string>();
    const maxAttempts = quantity * 5;
    let attempts = 0;

    while (generatedCodes.size < quantity && attempts < maxAttempts) {
      generatedCodes.add(generateVoucherCode('VC'));
      attempts++;
    }

    if (generatedCodes.size < quantity) {
      throw new AppError('Failed to generate unique voucher codes. Please try again.', 500);
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
      status: 'active' as const,
      createdBy: new Types.ObjectId(caller.userId),
    }));

    const vouchers = await promotionRepository.createManyVouchers(voucherData);
    return {
      message: `${vouchers.length} vouchers generated successfully`,
      data: vouchers.map(toVoucherResponse),
    };
  }

  async listVouchers(
    promotionId: string,
    filter: { status?: 'active' | 'used' | 'expired' | 'disabled'; page?: number; limit?: number },
    caller: CallerContext
  ) {
    const promotion = await promotionRepository.findPromotionById(promotionId);
    if (!promotion) throw new AppError('Promotion not found', 404);

    if (caller.role === 'branch_manager' && promotion.branchId?.toString() !== caller.branchId) {
      throw new AppError('You can only manage promotions of your own branch', 403);
    }

    const { data, total } = await promotionRepository.findVouchersByPromotion({
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

  async disableVoucher(voucherId: string, caller: CallerContext) {
    const voucher = await promotionRepository.findVoucherById(voucherId);
    if (!voucher) throw new AppError('Voucher not found', 404);

    const promotion = await promotionRepository.findPromotionById(
      voucher.promotionId.toString()
    );
    if (!promotion) throw new AppError('Promotion not found', 404);

    if (caller.role === 'branch_manager' && promotion.branchId?.toString() !== caller.branchId) {
      throw new AppError('You can only manage promotions of your own branch', 403);
    }

    if (voucher.status !== 'active') {
      throw new AppError(`Voucher is already ${voucher.status}`, 400);
    }

    const updated = await promotionRepository.updateVoucherStatus(voucherId, 'disabled');
    return toVoucherResponse(updated!);
  }

  async getVoucherResponse(voucher: IVoucher) {
    return toVoucherResponse(voucher);
  }
}

export const couponService = new CouponService();
