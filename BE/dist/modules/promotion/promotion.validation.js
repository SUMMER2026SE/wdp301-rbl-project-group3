"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.applyVoucherSchema = exports.lookupVoucherSchema = exports.voucherIdParamSchema = exports.listVouchersSchema = exports.generateVouchersSchema = exports.listActivePromotionsSchema = exports.listPromotionsSchema = exports.promotionIdParamSchema = exports.updatePromotionSchema = exports.createPromotionSchema = void 0;
const zod_1 = require("zod");
const dateString = zod_1.z
    .string()
    .or(zod_1.z.date())
    .refine((v) => !isNaN(new Date(v).getTime()), { message: 'Invalid date format' });
const mongoId = zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
exports.createPromotionSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        name: zod_1.z.string().min(2).max(200).trim(),
        description: zod_1.z.string().max(1000).trim().optional(),
        discountType: zod_1.z.enum(['percentage', 'fixed_amount']),
        discountValue: zod_1.z.number().min(0),
        maxDiscountAmount: zod_1.z.number().min(0).optional(),
        minOrderAmount: zod_1.z.number().min(0).optional(),
        scope: zod_1.z.enum(['global', 'branch']),
        branchId: mongoId.optional(),
        startDate: dateString,
        endDate: dateString,
        usageLimit: zod_1.z.number().int().min(1).optional(),
        status: zod_1.z.enum(['draft', 'active']).optional(),
    })
        .refine((d) => d.discountType !== 'percentage' || d.discountValue <= 100, { message: 'Percentage discount value must be between 0 and 100', path: ['discountValue'] })
        .refine((d) => new Date(d.endDate) > new Date(d.startDate), { message: 'End date must be after start date', path: ['endDate'] }),
});
exports.updatePromotionSchema = zod_1.z.object({
    params: zod_1.z.object({ id: mongoId }),
    body: zod_1.z
        .object({
        name: zod_1.z.string().min(2).max(200).trim().optional(),
        description: zod_1.z.string().max(1000).trim().optional(),
        discountType: zod_1.z.enum(['percentage', 'fixed_amount']).optional(),
        discountValue: zod_1.z.number().min(0).optional(),
        maxDiscountAmount: zod_1.z.number().min(0).optional(),
        minOrderAmount: zod_1.z.number().min(0).optional(),
        startDate: dateString.optional(),
        endDate: dateString.optional(),
        usageLimit: zod_1.z.number().int().min(1).optional(),
        status: zod_1.z.enum(['draft', 'active', 'inactive']).optional(),
    })
        .refine((d) => !(d.discountType === 'percentage' && d.discountValue !== undefined && d.discountValue > 100), { message: 'Percentage discount value must be between 0 and 100', path: ['discountValue'] }),
});
exports.promotionIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: mongoId }),
});
exports.listPromotionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['draft', 'active', 'inactive', 'expired']).optional(),
        scope: zod_1.z.enum(['global', 'branch']).optional(),
        branchId: mongoId.optional(),
        page: zod_1.z.coerce.number().int().min(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    }),
});
exports.listActivePromotionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        branchId: mongoId.optional(),
        page: zod_1.z.coerce.number().int().min(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    }),
});
exports.generateVouchersSchema = zod_1.z.object({
    params: zod_1.z.object({ id: mongoId }),
    body: zod_1.z.object({
        quantity: zod_1.z.number().int().min(1).max(500),
    }),
});
exports.listVouchersSchema = zod_1.z.object({
    params: zod_1.z.object({ id: mongoId }),
    query: zod_1.z.object({
        status: zod_1.z.enum(['active', 'used', 'expired', 'disabled']).optional(),
        page: zod_1.z.coerce.number().int().min(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(200).optional(),
    }),
});
exports.voucherIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ voucherId: mongoId }),
});
exports.lookupVoucherSchema = zod_1.z.object({
    query: zod_1.z.object({
        code: zod_1.z.string().min(1, 'Voucher code is required'),
        orderValue: zod_1.z.coerce.number().min(0).optional(),
        branchId: mongoId.optional(),
    }),
});
exports.applyVoucherSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1, 'Voucher code is required'),
        orderValue: zod_1.z.number().min(0),
        branchId: mongoId.optional(),
        orderId: mongoId,
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
//# sourceMappingURL=promotion.validation.js.map