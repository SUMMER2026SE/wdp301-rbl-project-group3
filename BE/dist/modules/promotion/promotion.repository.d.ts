import { Types } from 'mongoose';
import { IPromotion, PromotionStatus } from '../../models/promotion.model';
import { IVoucher, VoucherStatus } from '../../models/voucher.model';
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
export declare class PromotionRepository {
    createPromotion(data: Partial<IPromotion>): Promise<IPromotion>;
    findPromotionById(id: string): Promise<IPromotion | null>;
    findPromotions(filter: PromotionFilter): Promise<{
        data: IPromotion[];
        total: number;
    }>;
    updatePromotion(id: string, data: UpdatePromotionData): Promise<IPromotion | null>;
    deletePromotion(id: string): Promise<IPromotion | null>;
    incrementUsageCount(promotionId: string): Promise<void>;
    createVoucher(data: Partial<IVoucher>): Promise<IVoucher>;
    createManyVouchers(data: Partial<IVoucher>[]): Promise<IVoucher[]>;
    findVoucherByCode(code: string): Promise<IVoucher | null>;
    findVoucherById(id: string): Promise<IVoucher | null>;
    findVouchersByPromotion(filter: VoucherFilter): Promise<{
        data: IVoucher[];
        total: number;
    }>;
    updateVoucherStatus(id: string, status: VoucherStatus): Promise<IVoucher | null>;
    markVoucherUsed(id: string, userId: string): Promise<IVoucher | null>;
    disableManyVouchersByPromotion(promotionId: string): Promise<void>;
    countActiveVouchersByPromotion(promotionId: string): Promise<number>;
}
export declare const promotionRepository: PromotionRepository;
//# sourceMappingURL=promotion.repository.d.ts.map