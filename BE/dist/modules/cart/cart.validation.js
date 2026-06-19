"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.removeCartItemSchema = exports.updateCartItemSchema = exports.addToCartSchema = void 0;
const zod_1 = require("zod");
const objectIdSchema = zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
// UC07 — Thêm sản phẩm vào giỏ
exports.addToCartSchema = zod_1.z.object({
    body: zod_1.z.object({
        productId: objectIdSchema,
        quantity: zod_1.z
            .number({ message: 'Quantity must be a number' })
            .int('Quantity must be an integer')
            .min(1, 'Quantity must be at least 1')
            .max(100, 'Quantity cannot exceed 100 per request'),
    }),
});
// UC08 — Cập nhật số lượng item
exports.updateCartItemSchema = zod_1.z.object({
    params: zod_1.z.object({
        itemId: objectIdSchema,
    }),
    body: zod_1.z.object({
        quantity: zod_1.z
            .number({ message: 'Quantity must be a number' })
            .int('Quantity must be an integer')
            .min(0, 'Quantity must be 0 or greater (0 = remove item)')
            .max(999, 'Quantity cannot exceed 999'),
    }),
});
// UC08 — Xóa item
exports.removeCartItemSchema = zod_1.z.object({
    params: zod_1.z.object({
        itemId: objectIdSchema,
    }),
});
const validate = (schema) => {
    return (req, _res, next) => {
        try {
            schema.parse({ body: req.body, query: req.query, params: req.params });
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=cart.validation.js.map