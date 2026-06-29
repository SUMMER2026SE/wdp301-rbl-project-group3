import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const returnIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listReturnsSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        branchId: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
        customerId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            pending: "pending";
            cancelled: "cancelled";
            approved: "approved";
            completing: "completing";
            completed: "completed";
            rejected: "rejected";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createReturnSchema: z.ZodObject<{
    body: z.ZodObject<{
        orderId: z.ZodString;
        reason: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            quantity: z.ZodNumber;
            condition: z.ZodEnum<{
                expired: "expired";
                resellable: "resellable";
                damaged: "damaged";
            }>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateReturnSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        reason: z.ZodOptional<z.ZodString>;
        items: z.ZodOptional<z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            quantity: z.ZodNumber;
            condition: z.ZodEnum<{
                expired: "expired";
                resellable: "resellable";
                damaged: "damaged";
            }>;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const cancelReturnSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        reason: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const resolveReturnSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        note: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const rejectReturnSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        note: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const completeReturnSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        refundMethod: z.ZodEnum<{
            cash: "cash";
            bank_transfer: "bank_transfer";
            original_payment: "original_payment";
            other: "other";
        }>;
        refundReference: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=return.validation.d.ts.map