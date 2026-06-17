import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

// UC07 — Thêm sản phẩm vào giỏ
export const addToCartSchema = z.object({
    body: z.object({
        productId: objectIdSchema,
        quantity: z
            .number({ message: 'Quantity must be a number' })
            .int('Quantity must be an integer')
            .min(1, 'Quantity must be at least 1')
            .max(100, 'Quantity cannot exceed 100 per request'),
    }),
});

// UC08 — Cập nhật số lượng item
export const updateCartItemSchema = z.object({
    params: z.object({
        itemId: objectIdSchema,
    }),
    body: z.object({
        quantity: z
            .number({ message: 'Quantity must be a number' })
            .int('Quantity must be an integer')
            .min(0, 'Quantity must be 0 or greater (0 = remove item)')
            .max(999, 'Quantity cannot exceed 999'),
    }),
});

// UC08 — Xóa item
export const removeCartItemSchema = z.object({
    params: z.object({
        itemId: objectIdSchema,
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
