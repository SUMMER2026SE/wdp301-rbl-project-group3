"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.listFlashSalesSchema = exports.flashSaleIdParamSchema = exports.updateFlashSaleSchema = exports.createFlashSaleSchema = void 0;
const zod_1 = require("zod");
const dateString = zod_1.z
    .string()
    .or(zod_1.z.date())
    .refine((v) => !isNaN(new Date(v).getTime()), { message: 'Invalid date format' });
const mongoId = zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
const flashSaleProductSchema = zod_1.z.object({
    productId: mongoId,
    flashSalePrice: zod_1.z.number().min(0),
    limitQuantity: zod_1.z.number().int().min(1),
});
exports.createFlashSaleSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        name: zod_1.z.string().min(2).max(200).trim(),
        description: zod_1.z.string().max(1000).trim().optional(),
        startDate: dateString,
        endDate: dateString,
        scope: zod_1.z.enum(['global', 'branch']),
        branchId: mongoId.optional(),
        products: zod_1.z.array(flashSaleProductSchema).min(1, 'At least one product is required'),
        status: zod_1.z.enum(['draft', 'active', 'inactive']).optional(),
    })
        .refine((d) => new Date(d.endDate) > new Date(d.startDate), { message: 'End date must be after start date', path: ['endDate'] })
        .refine((d) => d.scope !== 'branch' || !!d.branchId, { message: 'Branch ID is required when scope is branch', path: ['branchId'] }),
});
exports.updateFlashSaleSchema = zod_1.z.object({
    params: zod_1.z.object({ id: mongoId }),
    body: zod_1.z
        .object({
        name: zod_1.z.string().min(2).max(200).trim().optional(),
        description: zod_1.z.string().max(1000).trim().optional(),
        startDate: dateString.optional(),
        endDate: dateString.optional(),
        scope: zod_1.z.enum(['global', 'branch']).optional(),
        branchId: mongoId.optional(),
        products: zod_1.z.array(flashSaleProductSchema).min(1).optional(),
        status: zod_1.z.enum(['draft', 'active', 'inactive']).optional(),
    })
        .refine((d) => {
        if (d.startDate && d.endDate) {
            return new Date(d.endDate) > new Date(d.startDate);
        }
        return true;
    }, { message: 'End date must be after start date', path: ['endDate'] }),
});
exports.flashSaleIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: mongoId }),
});
exports.listFlashSalesSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['draft', 'active', 'inactive', 'expired']).optional(),
        scope: zod_1.z.enum(['global', 'branch']).optional(),
        branchId: mongoId.optional(),
        page: zod_1.z.coerce.number().int().min(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
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
//# sourceMappingURL=flash-sale.validation.js.map