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
            cancelled: "cancelled";
            pending: "pending";
            confirmed: "confirmed";
            preparing: "preparing";
            delivering: "delivering";
            delivered: "delivered";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        status: z.ZodEnum<{
            cancelled: "cancelled";
            pending: "pending";
            confirmed: "confirmed";
            preparing: "preparing";
            delivering: "delivering";
            delivered: "delivered";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const myOrdersSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            cancelled: "cancelled";
            pending: "pending";
            confirmed: "confirmed";
            preparing: "preparing";
            delivering: "delivering";
            delivered: "delivered";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const myOrderIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        orderId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const cancelOrderSchema: z.ZodObject<{
    params: z.ZodObject<{
        orderId: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        reason: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const placeOrderSchema: z.ZodObject<{
    body: z.ZodObject<{
        branchId: z.ZodString;
        shippingAddress: z.ZodString;
        phoneNumber: z.ZodString;
        note: z.ZodOptional<z.ZodString>;
        paymentMethod: z.ZodEnum<{
            COD: "COD";
            banking: "banking";
            momo: "momo";
            vnpay: "vnpay";
        }>;
        voucherCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=order.validation.d.ts.map