import { Types } from 'mongoose';
import { promotionRepository } from '../promotion.repository';
import { CallerContext } from '../types';
import { AppError } from '../../../middlewares/errorHandler.middleware';
import { IVoucher, Voucher } from '../../../models/voucher.model';
import { Promotion } from '../../../models/promotion.model';

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
  async generateVouchers(
    promotionId: string,
    code: string,
    caller: CallerContext
  ) {
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

    const normalizedCode = code.trim().toUpperCase();
    const exists = await promotionRepository.findVoucherByCode(normalizedCode);
    if (exists) {
      throw new AppError(`Voucher code "${normalizedCode}" already exists`, 400);
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
      status: 'active' as const,
      createdBy: new Types.ObjectId(caller.userId),
    };

    const voucher = await promotionRepository.createVoucher(voucherData);
    return {
      message: `Voucher "${normalizedCode}" created successfully`,
      data: toVoucherResponse(voucher),
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

  async claimVoucher(code: string, caller: CallerContext) {
    const normalizedCode = code.trim().toUpperCase();
    const voucher = await Voucher.findOne({ code: normalizedCode }).exec();
    if (!voucher) {
      throw new AppError('Mã giảm giá không tồn tại hoặc không hợp lệ', 404);
    }

    if (voucher.status === 'disabled') {
      throw new AppError('Mã giảm giá này đã bị vô hiệu hóa', 400);
    }

    if (voucher.expiresAt < new Date()) {
      throw new AppError('Mã giảm giá này đã hết hạn', 400);
    }

    const promotion = await promotionRepository.findPromotionById(voucher.promotionId.toString());
    if (!promotion || promotion.status !== 'active') {
      throw new AppError('Chương trình khuyến mãi này đã kết thúc hoặc không khả dụng', 400);
    }

    // Kiểm tra xem người dùng đã claim mã này chưa
    const alreadyClaimed = voucher.claims?.some(
      (c) => c.userId.toString() === caller.userId
    );
    if (alreadyClaimed) {
      throw new AppError('Bạn đã nhận mã giảm giá này rồi', 400);
    }

    // Push claim mới vào mảng claims
    voucher.claims = voucher.claims || [];
    voucher.claims.push({
      userId: new Types.ObjectId(caller.userId),
      status: 'active',
      claimedAt: new Date(),
    });

    await voucher.save();

    return {
      message: 'Nhận mã giảm giá thành công',
      code: voucher.code,
    };
  }

  async getVoucherResponse(voucher: IVoucher) {
    return toVoucherResponse(voucher);
  }
}

export const couponService = new CouponService();
