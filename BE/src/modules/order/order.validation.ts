import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

// UC09 — Đặt hàng
export const placeOrderSchema = z.object({
    body: z.object({
        branchId: objectIdSchema,
        shippingAddress: z
            .string()
            .min(10, 'Shipping address must be at least 10 characters')
            .max(255),
        phoneNumber: z
            .string()
            .regex(/^(0|\+84)[0-9]{8,10}$/, 'Invalid Vietnamese phone number'),
        note: z.string().max(500).optional(),
        paymentMethod: z
            .enum(['COD', 'banking', 'momo', 'vnpay'])
            .default('COD'),
        /** Tuỳ chọn: chỉ đặt những item được chọn trong giỏ */
        selectedItemIds: z.array(objectIdSchema).optional(),
    }),
});

// GET /orders/:orderId
export const getOrderSchema = z.object({
    params: z.object({
        orderId: objectIdSchema,
    }),
});

export const validate = <T extends z.ZodTypeAny>(schema: T) => {
    return (
        req: import('express').Request,
        _res: import('express').Response,
        next: import('express').NextFunction
    ) => {
        try {
            schema.parse({ body: req.body, query: req.query, params: req.params });
            next();
        } catch (error) {
            next(error);
        }
    };
};
