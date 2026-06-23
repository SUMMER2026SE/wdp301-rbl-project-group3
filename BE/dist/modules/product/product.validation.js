"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.updateProductSchema = exports.createProductSchema = exports.listProductsSchema = exports.productIdParamSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const emptyToUndefined = (schema) => zod_1.z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), schema);
exports.productIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
});
exports.listProductsSchema = zod_1.z
    .object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
        keyword: zod_1.z.string().max(100).optional(),
        categoryId: objectId.optional(),
        minPrice: zod_1.z.coerce.number().min(0).optional(),
        maxPrice: zod_1.z.coerce.number().min(0).optional(),
        branchId: objectId.optional(),
    }),
})
    .refine((data) => {
    const { minPrice, maxPrice } = data.query;
    if (minPrice !== undefined && maxPrice !== undefined) {
        return minPrice <= maxPrice;
    }
    return true;
}, { message: 'minPrice must be less than or equal to maxPrice' });
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(150),
        sku: zod_1.z.string().min(2).max(50),
        description: emptyToUndefined(zod_1.z.string().max(1000).optional()),
        categoryId: emptyToUndefined(objectId.optional()),
        unit: emptyToUndefined(zod_1.z.string().min(1).max(30).optional()),
        salePrice: zod_1.z.coerce.number().min(0).optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }),
});
exports.updateProductSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(150).optional(),
        sku: zod_1.z.string().min(2).max(50).optional(),
        description: emptyToUndefined(zod_1.z.string().max(1000).optional()),
        categoryId: emptyToUndefined(objectId.optional()),
        unit: emptyToUndefined(zod_1.z.string().min(1).max(30).optional()),
        salePrice: zod_1.z.coerce.number().min(0).optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }),
});
//# sourceMappingURL=product.validation.js.map