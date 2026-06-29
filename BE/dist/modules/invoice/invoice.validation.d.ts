import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const invoiceIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const invoiceOrderIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        orderId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=invoice.validation.d.ts.map