"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.listBannersSchema = exports.bannerIdParamSchema = exports.updateBannerSchema = exports.createBannerSchema = void 0;
const zod_1 = require("zod");
const mongoId = zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
exports.createBannerSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(2, 'Title must have at least 2 characters').max(200).trim(),
        subtitle: zod_1.z.string().min(2, 'Subtitle must have at least 2 characters').max(200).trim(),
        description: zod_1.z.string().max(500).trim().optional(),
        promoCode: zod_1.z.string().max(50).trim().optional(),
        imageUrl: zod_1.z.string().url('Invalid image URL').optional(), // Wait, image might be uploaded via file, so imageUrl might be added in controller. If not uploaded, we can pass url.
        linkUrl: zod_1.z.string().max(500).trim().optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
        order: zod_1.z.coerce.number().int().min(0).optional(),
    }),
});
exports.updateBannerSchema = zod_1.z.object({
    params: zod_1.z.object({ id: mongoId }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(2).max(200).trim().optional(),
        subtitle: zod_1.z.string().min(2).max(200).trim().optional(),
        description: zod_1.z.string().max(500).trim().optional(),
        promoCode: zod_1.z.string().max(50).trim().optional(),
        imageUrl: zod_1.z.string().url('Invalid image URL').optional(),
        linkUrl: zod_1.z.string().max(500).trim().optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
        order: zod_1.z.coerce.number().int().min(0).optional(),
    }),
});
exports.bannerIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: mongoId }),
});
exports.listBannersSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['active', 'inactive']).optional(),
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
//# sourceMappingURL=banner.validation.js.map