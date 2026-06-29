import { z } from 'zod';
export declare const createPromotionSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        discountType: z.ZodEnum<{
            percentage: "percentage";
            fixed_amount: "fixed_amount";
        }>;
        discountValue: z.ZodNumber;
        maxDiscountAmount: z.ZodOptional<z.ZodNumber>;
        minOrderAmount: z.ZodOptional<z.ZodNumber>;
        pointCost: z.ZodOptional<z.ZodNumber>;
        targetMemberLevel: z.ZodOptional<z.ZodEnum<{
            new: "new";
            bronze: "bronze";
            silver: "silver";
            gold: "gold";
            diamond: "diamond";
            all: "all";
        }>>;
        scope: z.ZodEnum<{
            global: "global";
            branch: "branch";
        }>;
        branchId: z.ZodOptional<z.ZodString>;
        startDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        endDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        usageLimit: z.ZodOptional<z.ZodNumber>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            draft: "draft";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updatePromotionSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        discountType: z.ZodOptional<z.ZodEnum<{
            percentage: "percentage";
            fixed_amount: "fixed_amount";
        }>>;
        discountValue: z.ZodOptional<z.ZodNumber>;
        maxDiscountAmount: z.ZodOptional<z.ZodNumber>;
        minOrderAmount: z.ZodOptional<z.ZodNumber>;
        pointCost: z.ZodOptional<z.ZodNumber>;
        targetMemberLevel: z.ZodOptional<z.ZodEnum<{
            new: "new";
            bronze: "bronze";
            silver: "silver";
            gold: "gold";
            diamond: "diamond";
            all: "all";
        }>>;
        startDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
        endDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
        usageLimit: z.ZodOptional<z.ZodNumber>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
            draft: "draft";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const promotionIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listPromotionsSchema: z.ZodObject<{
    query: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
            draft: "draft";
            expired: "expired";
        }>>;
        scope: z.ZodOptional<z.ZodEnum<{
            global: "global";
            branch: "branch";
        }>>;
        branchId: z.ZodOptional<z.ZodString>;
        page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listActivePromotionsSchema: z.ZodObject<{
    query: z.ZodObject<{
        branchId: z.ZodOptional<z.ZodString>;
        page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        onlyClaimed: z.ZodOptional<z.ZodPreprocess<z.ZodBoolean>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const claimVoucherSchema: z.ZodObject<{
    body: z.ZodObject<{
        code: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const generateVouchersSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        code: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listVouchersSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    query: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            expired: "expired";
            used: "used";
            disabled: "disabled";
        }>>;
        page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const voucherIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        voucherId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const lookupVoucherSchema: z.ZodObject<{
    query: z.ZodObject<{
        code: z.ZodString;
        orderValue: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        branchId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const applyVoucherSchema: z.ZodObject<{
    body: z.ZodObject<{
        code: z.ZodString;
        orderValue: z.ZodNumber;
        branchId: z.ZodOptional<z.ZodString>;
        orderId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const validate: <T extends z.ZodTypeAny>(schema: T) => (req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=promotion.validation.d.ts.map