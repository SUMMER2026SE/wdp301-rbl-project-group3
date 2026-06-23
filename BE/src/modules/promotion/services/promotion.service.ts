import { Types } from 'mongoose';
import { promotionRepository, PromotionFilter } from '../promotion.repository';
import { Promotion, IPromotion, PromotionStatus } from '../../../models/promotion.model';
import { Voucher } from '../../../models/voucher.model';
import { AppError } from '../../../middlewares/errorHandler.middleware';
import { CallerContext } from '../types';

function toPromotionResponse(p: IPromotion) {
  return {
    id: p._id.toString(),
    name: p.name,
    description: p.description,
    discountType: p.discountType,
    discountValue: p.discountValue,
    maxDiscountAmount: p.maxDiscountAmount,
    minOrderAmount: p.minOrderAmount,
    scope: p.scope,
    branchId: p.branchId?.toString(),
    startDate: p.startDate,
    endDate: p.endDate,
    usageLimit: p.usageLimit,
    usageCount: p.usageCount,
    status: p.status,
    createdBy: p.createdBy.toString(),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export class PromotionService {
  private assertCanManage(promotion: IPromotion, caller: CallerContext): void {
    if (caller.role === 'admin') return;

    if (caller.role === 'branch_manager') {
      if (
        !promotion.branchId ||
        !caller.branchId ||
        promotion.branchId.toString() !== caller.branchId
      ) {
        throw new AppError('You can only manage promotions of your own branch', 403);
      }
      return;
    }

    throw new AppError('Insufficient permissions', 403);
  }

  async createPromotion(
    data: {
      name: string;
      description?: string;
      discountType: 'percentage' | 'fixed_amount';
      discountValue: number;
      maxDiscountAmount?: number;
      minOrderAmount?: number;
      scope: 'global' | 'branch';
      branchId?: string;
      startDate: Date;
      endDate: Date;
      usageLimit?: number;
      status?: PromotionStatus;
    },
    caller: CallerContext
  ) {
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      throw new AppError('Percentage discount value must be between 0 and 100', 400);
    }

    if (new Date(data.endDate) <= new Date(data.startDate)) {
      throw new AppError('End date must be after start date', 400);
    }

    if (data.scope === 'global' && caller.role !== 'admin') {
      throw new AppError('Only admin can create global promotions', 403);
    }

    if (data.scope === 'branch') {
      if (caller.role === 'branch_manager') {
        if (!caller.branchId) throw new AppError('Your account is not assigned to any branch', 400);
        if (data.branchId && data.branchId !== caller.branchId) {
          throw new AppError('You can only create promotions for your own branch', 403);
        }
        data.branchId = caller.branchId;
      } else if (caller.role === 'admin') {
        if (!data.branchId) throw new AppError('branchId is required for branch-scoped promotions', 400);
      }
    }

    const promotion = await promotionRepository.createPromotion({
      ...data,
      branchId: data.branchId ? new Types.ObjectId(data.branchId) : undefined,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: data.status ?? 'draft',
      usageCount: 0,
      createdBy: new Types.ObjectId(caller.userId),
    });

    return toPromotionResponse(promotion);
  }

  async listPromotions(
    filter: {
      status?: PromotionStatus;
      scope?: 'global' | 'branch';
      branchId?: string;
      page?: number;
      limit?: number;
    },
    caller: CallerContext
  ) {
    const query: PromotionFilter = {
      status: filter.status,
      scope: filter.scope,
      page: filter.page,
      limit: filter.limit,
    };

    if (caller.role === 'branch_manager') {
      if (!caller.branchId) throw new AppError('Your account is not assigned to any branch', 400);
      query.branchId = caller.branchId;
    } else if (caller.role === 'admin' && filter.branchId) {
      query.branchId = filter.branchId;
    }

    const { data, total } = await promotionRepository.findPromotions(query);
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    return {
      data: data.map(toPromotionResponse),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async listActivePromotions(
    filter: { branchId?: string; page?: number; limit?: number; onlyClaimed?: boolean },
    caller: CallerContext
  ) {
    const now = new Date();
    const query: any = {
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (filter.branchId) {
      query.$or = [
        { scope: 'global' },
        { scope: 'branch', branchId: new Types.ObjectId(filter.branchId) },
      ];
    } else {
      query.scope = 'global';
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Promotion.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Promotion.countDocuments(query).exec(),
    ]);

    const callerUserId = caller.userId;

    const dataWithVouchers = await Promise.all(
      data.map(async (p) => {
        const queryVoucher: any = { promotionId: p._id, status: 'active', expiresAt: { $gt: now } };
        const vouchers = await Voucher.find(queryVoucher).exec();

        const vouchersList = vouchers.map((v) => {
          const userClaim = v.claims?.find(
            (c) => c.userId.toString() === callerUserId
          );
          return {
            code: v.code,
            isClaimed: !!userClaim,
            claimStatus: userClaim ? userClaim.status : null,
          };
        });

        let filteredVouchers = vouchersList;
        if (filter.onlyClaimed) {
          filteredVouchers = vouchersList.filter(
            (v) => v.isClaimed && v.claimStatus === 'active'
          );
        }

        const promoRes = toPromotionResponse(p);
        return {
          ...promoRes,
          vouchers: filteredVouchers.map((v) => v.code),
          vouchersDetail: filteredVouchers,
        };
      })
    );

    const finalData = dataWithVouchers.filter((p) => p.vouchers.length > 0);

    return {
      data: finalData,
      pagination: {
        total: finalData.length,
        page,
        limit,
        totalPages: Math.ceil(finalData.length / limit),
      },
    };
  }

  async getPromotion(promotionId: string, caller: CallerContext) {
    const promotion = await promotionRepository.findPromotionById(promotionId);
    if (!promotion) throw new AppError('Promotion not found', 404);

    if (caller.role === 'branch_manager') {
      if (
        !promotion.branchId ||
        !caller.branchId ||
        promotion.branchId.toString() !== caller.branchId
      ) {
        throw new AppError('Promotion not found', 404);
      }
    }

    return toPromotionResponse(promotion);
  }

  async updatePromotion(
    promotionId: string,
    data: {
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
    },
    caller: CallerContext
  ) {
    const promotion = await promotionRepository.findPromotionById(promotionId);
    if (!promotion) throw new AppError('Promotion not found', 404);

    this.assertCanManage(promotion, caller);

    if (promotion.status === 'expired') {
      throw new AppError('Cannot update an expired promotion', 400);
    }

    if (
      data.discountType === 'percentage' &&
      data.discountValue !== undefined &&
      data.discountValue > 100
    ) {
      throw new AppError('Percentage discount value must be between 0 and 100', 400);
    }

    const startDate = data.startDate ? new Date(data.startDate) : promotion.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : promotion.endDate;
    if (endDate <= startDate) throw new AppError('End date must be after start date', 400);

    const updated = await promotionRepository.updatePromotion(promotionId, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      updatedBy: new Types.ObjectId(caller.userId),
    });

    if (!updated) throw new AppError('Promotion not found', 404);
    return toPromotionResponse(updated);
  }

  async deletePromotion(promotionId: string, caller: CallerContext) {
    const promotion = await promotionRepository.findPromotionById(promotionId);
    if (!promotion) throw new AppError('Promotion not found', 404);

    this.assertCanManage(promotion, caller);

    if (promotion.status === 'active') {
      throw new AppError('Cannot delete an active promotion. Deactivate it first.', 400);
    }

    await promotionRepository.disableManyVouchersByPromotion(promotionId);
    await promotionRepository.deletePromotion(promotionId);

    return { message: 'Promotion deleted successfully' };
  }

  async activatePromotion(promotionId: string, caller: CallerContext) {
    const promotion = await promotionRepository.findPromotionById(promotionId);
    if (!promotion) throw new AppError('Promotion not found', 404);

    this.assertCanManage(promotion, caller);

    if (promotion.status === 'active') throw new AppError('Promotion is already active', 400);
    if (promotion.status === 'expired') throw new AppError('Cannot activate an expired promotion', 400);
    if (promotion.endDate < new Date()) throw new AppError('Promotion end date has already passed', 400);

    const updated = await promotionRepository.updatePromotion(promotionId, {
      status: 'active',
      updatedBy: new Types.ObjectId(caller.userId),
    });

    return toPromotionResponse(updated!);
  }

  async deactivatePromotion(promotionId: string, caller: CallerContext) {
    const promotion = await promotionRepository.findPromotionById(promotionId);
    if (!promotion) throw new AppError('Promotion not found', 404);

    this.assertCanManage(promotion, caller);

    if (promotion.status !== 'active') throw new AppError('Promotion is not active', 400);

    await promotionRepository.disableManyVouchersByPromotion(promotionId);

    const updated = await promotionRepository.updatePromotion(promotionId, {
      status: 'inactive',
      updatedBy: new Types.ObjectId(caller.userId),
    });

    return toPromotionResponse(updated!);
  }
}

export const promotionService = new PromotionService();
