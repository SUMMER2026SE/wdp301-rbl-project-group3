import { CallerContext } from '../types';
import { IVoucher } from '../../../models/voucher.model';
export declare class CouponService {
    generateVouchers(promotionId: string, quantity: number, caller: CallerContext): Promise<{
        message: string;
        data: {
            id: string;
            code: string;
            promotionId: string;
            discountType: import("../../../models/promotion.model").DiscountType;
            discountValue: number;
            maxDiscountAmount: number | undefined;
            minOrderAmount: number | undefined;
            branchId: string | undefined;
            expiresAt: Date;
            status: import("../../../models/voucher.model").VoucherStatus;
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
            discountType: import("../../../models/promotion.model").DiscountType;
            discountValue: number;
            maxDiscountAmount: number | undefined;
            minOrderAmount: number | undefined;
            branchId: string | undefined;
            expiresAt: Date;
            status: import("../../../models/voucher.model").VoucherStatus;
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
        discountType: import("../../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        branchId: string | undefined;
        expiresAt: Date;
        status: import("../../../models/voucher.model").VoucherStatus;
        usedBy: string | undefined;
        usedAt: Date | undefined;
        createdAt: Date;
    }>;
    getVoucherResponse(voucher: IVoucher): Promise<{
        id: string;
        code: string;
        promotionId: string;
        discountType: import("../../../models/promotion.model").DiscountType;
        discountValue: number;
        maxDiscountAmount: number | undefined;
        minOrderAmount: number | undefined;
        branchId: string | undefined;
        expiresAt: Date;
        status: import("../../../models/voucher.model").VoucherStatus;
        usedBy: string | undefined;
        usedAt: Date | undefined;
        createdAt: Date;
    }>;
}
export declare const couponService: CouponService;
//# sourceMappingURL=coupon.service.d.ts.map