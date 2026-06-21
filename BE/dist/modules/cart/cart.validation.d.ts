import { z } from 'zod';
export declare const addToCartSchema: z.ZodObject<{
    body: z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateCartItemSchema: z.ZodObject<{
    params: z.ZodObject<{
        itemId: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        quantity: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const removeCartItemSchema: z.ZodObject<{
    params: z.ZodObject<{
        itemId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const validate: <T extends z.ZodTypeAny>(schema: T) => (req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=cart.validation.d.ts.map