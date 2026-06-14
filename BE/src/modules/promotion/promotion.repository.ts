import { Types } from 'mongoose';
import { Promotion, IPromotion, PromotionStatus } from '../../models/promotion.model';
import { Voucher, IVoucher, VoucherStatus } from '../../models/voucher.model';

export interface PromotionFilter {
  status?: PromotionStatus;
  scope?: 'global' | 'branch';
  branchId?: string;
  page?: number;
  limit?: number;
}

export interface VoucherFilter {
  promotionId?: string;
  status?: VoucherStatus;
  branchId?: string;
  page?: number;
  limit?: number;
}

export interface UpdatePromotionData {
  name?: string;
  description?: string;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number;
  status?: PromotionStatus;
  updatedBy?: Types.ObjectId;
}

export class PromotionRepository {
  // ─── Promotion ────────────────────────────────────────────

  async createPromotion(data: Partial<IPromotion>): Promise<IPromotion> {
    const promotion = new Promotion(data);
    return promotion.save();
  }

  async findPromotionById(id: string): Promise<IPromotion | null> {
    return Promotion.findById(id).exec();
  }

  async findPromotions(
    filter: PromotionFilter
  ): Promise<{ data: IPromotion[]; total: number }> {
    const { status, scope, branchId, page = 1, limit = 20 } = filter;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (scope) query.scope = scope;
    if (branchId) query.branchId = new Types.ObjectId(branchId);

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Promotion.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Promotion.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async updatePromotion(id: string, data: UpdatePromotionData): Promise<IPromotion | null> {
    return Promotion.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  async deletePromotion(id: string): Promise<IPromotion | null> {
    return Promotion.findByIdAndDelete(id).exec();
  }

  async incrementUsageCount(promotionId: string): Promise<void> {
    await Promotion.findByIdAndUpdate(promotionId, { $inc: { usageCount: 1 } }).exec();
  }

  // ─── Voucher ──────────────────────────────────────────────

  async createVoucher(data: Partial<IVoucher>): Promise<IVoucher> {
    const voucher = new Voucher(data);
    return voucher.save();
  }

  async createManyVouchers(data: Partial<IVoucher>[]): Promise<IVoucher[]> {
    const docs = await Voucher.insertMany(data);
    return docs as unknown as IVoucher[];
  }

  async findVoucherByCode(code: string): Promise<IVoucher | null> {
    return Voucher.findOne({ code: code.toUpperCase() }).exec();
  }

  async findVoucherById(id: string): Promise<IVoucher | null> {
    return Voucher.findById(id).exec();
  }

  async findVouchersByPromotion(
    filter: VoucherFilter
  ): Promise<{ data: IVoucher[]; total: number }> {
    const { promotionId, status, page = 1, limit = 50 } = filter;
    const query: Record<string, unknown> = {};

    if (promotionId) query.promotionId = new Types.ObjectId(promotionId);
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Voucher.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Voucher.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async updateVoucherStatus(id: string, status: VoucherStatus): Promise<IVoucher | null> {
    return Voucher.findByIdAndUpdate(id, { $set: { status } }, { new: true }).exec();
  }

  async markVoucherUsed(id: string, userId: string): Promise<IVoucher | null> {
    return Voucher.findByIdAndUpdate(
      id,
      { $set: { status: 'used', usedBy: new Types.ObjectId(userId), usedAt: new Date() } },
      { new: true }
    ).exec();
  }

  async disableManyVouchersByPromotion(promotionId: string): Promise<void> {
    await Voucher.updateMany(
      { promotionId: new Types.ObjectId(promotionId), status: 'active' },
      { $set: { status: 'disabled' } }
    ).exec();
  }

  async countActiveVouchersByPromotion(promotionId: string): Promise<number> {
    return Voucher.countDocuments({
      promotionId: new Types.ObjectId(promotionId),
      status: 'active',
    }).exec();
  }
}

export const promotionRepository = new PromotionRepository();