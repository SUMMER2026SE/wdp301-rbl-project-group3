"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.createProductSchema = exports.listProductsSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
exports.listProductsSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['active', 'inactive']).optional(),
        keyword: zod_1.z.string().max(100).optional(),
    }),
});
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(150),
        sku: zod_1.z.string().min(2).max(50),
        description: zod_1.z.string().max(1000).optional(),
        unit: zod_1.z.string().min(1).max(30).optional(),
        salePrice: zod_1.z.number().min(0).optional(),
        imageUrl: zod_1.z.string().url().optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }),
});
//# sourceMappingURL=product.validation.js.map