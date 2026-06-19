import { PromotionStatus } from '../../models/promotion.model';
import { UserRole } from '../../types/common.types';
export interface CallerContext {
    userId: string;
    role: UserRole;
    branchId?: string;
}
export declare class PromotionService {
    private assertCanManage;
    createPromotion(data: {
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
    }, caller: CallerContext): Promise<{
        id: string;
        name: string;
        description: string | undefined;
        discountType: import("../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        scope: import("../../models/promotion.model").PromotionScope;
        branchId: string | undefined;
        startDate: Date;
        endDate: Date;
        usageLimit: number | undefined;
        usageCount: number;
        status: PromotionStatus;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listPromotions(filter: {
        status?: PromotionStatus;
        scope?: 'global' | 'branch';
        branchId?: string;
        page?: number;
        limit?: number;
    }, caller: CallerContext): Promise<{
        data: {
            id: string;
            name: string;
            description: string | undefined;
            discountType: import("../../models/promotion.model").DiscountType;
            discountValue: number;
            maxDiscountAmount: number | undefined;
            minOrderAmount: number | undefined;
            scope: import("../../models/promotion.model").PromotionScope;
            branchId: string | undefined;
            startDate: Date;
            endDate: Date;
            usageLimit: number | undefined;
            usageCount: number;
            status: PromotionStatus;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    listActivePromotions(filter: {
        branchId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            id: string;
            name: string;
            description: string | undefined;
            discountType: import("../../models/promotion.model").DiscountType;
            discountValue: number;
            maxDiscountAmount: number | undefined;
            minOrderAmount: number | undefined;
            scope: import("../../models/promotion.model").PromotionScope;
            branchId: string | undefined;
            startDate: Date;
            endDate: Date;
            usageLimit: number | undefined;
            usageCount: number;
            status: PromotionStatus;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPromotion(promotionId: string, caller: CallerContext): Promise<{
        id: string;
        name: string;
        description: string | undefined;
        discountType: import("../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        scope: import("../../models/promotion.model").PromotionScope;
        branchId: string | undefined;
        startDate: Date;
        endDate: Date;
        usageLimit: number | undefined;
        usageCount: number;
        status: PromotionStatus;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePromotion(promotionId: string, data: {
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
    }, caller: CallerContext): Promise<{
        id: string;
        name: string;
        description: string | undefined;
        discountType: import("../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        scope: import("../../models/promotion.model").PromotionScope;
        branchId: string | undefined;
        startDate: Date;
        endDate: Date;
        usageLimit: number | undefined;
        usageCount: number;
        status: PromotionStatus;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePromotion(promotionId: string, caller: CallerContext): Promise<{
        message: string;
    }>;
    activatePromotion(promotionId: string, caller: CallerContext): Promise<{
        id: string;
        name: string;
        description: string | undefined;
        discountType: import("../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        scope: import("../../models/promotion.model").PromotionScope;
        branchId: string | undefined;
        startDate: Date;
        endDate: Date;
        usageLimit: number | undefined;
        usageCount: number;
        status: PromotionStatus;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deactivatePromotion(promotionId: string, caller: CallerContext): Promise<{
        id: string;
        name: string;
        description: string | undefined;
        discountType: import("../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        scope: import("../../models/promotion.model").PromotionScope;
        branchId: string | undefined;
        startDate: Date;
        endDate: Date;
        usageLimit: number | undefined;
        usageCount: number;
        status: PromotionStatus;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateVouchers(promotionId: string, quantity: number, caller: CallerContext): Promise<{
        message: string;
        data: {
            id: string;
            code: string;
            promotionId: string;
            discountType: import("../../models/promotion.model").DiscountType;
            discountValue: number;
            maxDiscountAmount: number | undefined;
            minOrderAmount: number | undefined;
            branchId: string | undefined;
            expiresAt: Date;
            status: import("../../models/voucher.model").VoucherStatus;
            usedBy: string | undefined;
            usedAt: Date | undefined;
            createdAt: Date;
        }[];
    }>;
    listVouchers(promotionId: string, filter: {
        status?: 'active' | 'used' | 'expired' | 'disabled';
        page?: number;
        limit?: number;
    }, caller: CallerContext): Promise<{
        data: {
            id: string;
            code: string;
            promotionId: string;
            discountType: import("../../models/promotion.model").DiscountType;
            discountValue: number;
            maxDiscountAmount: number | undefined;
            minOrderAmount: number | undefined;
            branchId: string | undefined;
            expiresAt: Date;
            status: import("../../models/voucher.model").VoucherStatus;
            usedBy: string | undefined;
            usedAt: Date | undefined;
            createdAt: Date;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    disableVoucher(voucherId: string, caller: CallerContext): Promise<{
        id: string;
        code: string;
        promotionId: string;
        discountType: import("../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        branchId: string | undefined;
        expiresAt: Date;
        status: import("../../models/voucher.model").VoucherStatus;
        usedBy: string | undefined;
        usedAt: Date | undefined;
        createdAt: Date;
    }>;
    lookupVoucher(code: string): Promise<{
        id: string;
        code: string;
        promotionId: string;
        discountType: import("../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        branchId: string | undefined;
        expiresAt: Date;
        status: import("../../models/voucher.model").VoucherStatus;
        usedBy: string | undefined;
        usedAt: Date | undefined;
        createdAt: Date;
    }>;
}
export declare const promotionService: PromotionService;
//# sourceMappingURL=promotion.service.d.ts.map