import { z } from 'zod';
export declare const trendQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        from: z.ZodOptional<z.ZodString>;
        to: z.ZodOptional<z.ZodString>;
        groupBy: z.ZodOptional<z.ZodEnum<{
            day: "day";
            month: "month";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const topPromotionsQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const branchOverviewQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        branchId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const branchTrendQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        branchId: z.ZodOptional<z.ZodString>;
        from: z.ZodOptional<z.ZodString>;
        to: z.ZodOptional<z.ZodString>;
        groupBy: z.ZodOptional<z.ZodEnum<{
            day: "day";
            month: "month";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const myStatsQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const validate: <T extends z.ZodTypeAny>(schema: T) => (req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=statistics.validation.d.ts.map