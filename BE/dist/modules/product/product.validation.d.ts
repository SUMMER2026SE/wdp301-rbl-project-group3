import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const listProductsSchema: z.ZodObject<{
    query: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
        keyword: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createProductSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        sku: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        unit: z.ZodOptional<z.ZodString>;
        salePrice: z.ZodOptional<z.ZodNumber>;
        imageUrl: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=product.validation.d.ts.map