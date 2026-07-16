import { z } from 'zod';
export declare const createFlashSaleSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        startDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        endDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        scope: z.ZodEnum<{
            global: "global";
            branch: "branch";
        }>;
        branchId: z.ZodOptional<z.ZodString>;
        products: z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            flashSalePrice: z.ZodNumber;
            limitQuantity: z.ZodNumber;
        }, z.core.$strip>>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
            draft: "draft";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateFlashSaleSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        startDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
        endDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
        scope: z.ZodOptional<z.ZodEnum<{
            global: "global";
            branch: "branch";
        }>>;
        branchId: z.ZodOptional<z.ZodString>;
        products: z.ZodOptional<z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            flashSalePrice: z.ZodNumber;
            limitQuantity: z.ZodNumber;
        }, z.core.$strip>>>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
            draft: "draft";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const flashSaleIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listFlashSalesSchema: z.ZodObject<{
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
export declare const validate: <T extends z.ZodTypeAny>(schema: T) => (req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=flash-sale.validation.d.ts.map