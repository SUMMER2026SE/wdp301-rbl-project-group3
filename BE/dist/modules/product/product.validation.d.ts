import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const productIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listProductsSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
        keyword: z.ZodOptional<z.ZodString>;
        categoryId: z.ZodOptional<z.ZodString>;
        minPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        maxPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createProductSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        sku: z.ZodString;
        description: z.ZodPreprocess<z.ZodOptional<z.ZodString>>;
        categoryId: z.ZodPreprocess<z.ZodOptional<z.ZodString>>;
        unit: z.ZodPreprocess<z.ZodOptional<z.ZodString>>;
        salePrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateProductSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        sku: z.ZodOptional<z.ZodString>;
        description: z.ZodPreprocess<z.ZodOptional<z.ZodString>>;
        categoryId: z.ZodPreprocess<z.ZodOptional<z.ZodString>>;
        unit: z.ZodPreprocess<z.ZodOptional<z.ZodString>>;
        salePrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=product.validation.d.ts.map