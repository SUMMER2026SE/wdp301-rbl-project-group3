import { z } from 'zod';
export declare const createBannerSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        subtitle: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        promoCode: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodString>;
        linkUrl: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
        order: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateBannerSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        promoCode: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodString>;
        linkUrl: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
        order: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const bannerIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listBannersSchema: z.ZodObject<{
    query: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
        page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const validate: <T extends z.ZodTypeAny>(schema: T) => (req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=banner.validation.d.ts.map