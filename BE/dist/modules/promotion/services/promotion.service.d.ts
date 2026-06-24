import { PromotionStatus } from '../../../models/promotion.model';
import { CallerContext } from '../types';
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
        discountType: import("../../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        scope: import("../../../models/promotion.model").PromotionScope;
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
            discountType: import("../../../models/promotion.model").DiscountType;
            discountValue: number;
            maxDiscountAmount: number | undefined;
            minOrderAmount: number | undefined;
            scope: import("../../../models/promotion.model").PromotionScope;
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
            discountType: import("../../../models/promotion.model").DiscountType;
            discountValue: number;
            maxDiscountAmount: number | undefined;
            minOrderAmount: number | undefined;
            scope: import("../../../models/promotion.model").PromotionScope;
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
        discountType: import("../../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        scope: import("../../../models/promotion.model").PromotionScope;
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
        discountType: import("../../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        scope: import("../../../models/promotion.model").PromotionScope;
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
        discountType: import("../../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        scope: import("../../../models/promotion.model").PromotionScope;
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
        discountType: import("../../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        scope: import("../../../models/promotion.model").PromotionScope;
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
}
export declare const promotionService: PromotionService;
//# sourceMappingURL=promotion.service.d.ts.map