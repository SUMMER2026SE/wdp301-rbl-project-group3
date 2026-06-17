import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const orderIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listOrdersSchema: z.ZodObject<{
    query: z.ZodObject<{
        branchId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            pending: "pending";
            confirmed: "confirmed";
            preparing: "preparing";
            delivering: "delivering";
            delivered: "delivered";
            cancelled: "cancelled";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        status: z.ZodEnum<{
            confirmed: "confirmed";
            preparing: "preparing";
            delivering: "delivering";
            delivered: "delivered";
            cancelled: "cancelled";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=order.validation.d.ts.map