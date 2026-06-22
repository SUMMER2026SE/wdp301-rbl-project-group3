"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.updateCategorySchema = exports.createCategorySchema = exports.listCategoriesSchema = exports.categoryIdParamSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
exports.categoryIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
});
exports.listCategoriesSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['active', 'inactive']).optional(),
        keyword: zod_1.z.string().max(100).optional(),
    }),
});
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100),
        code: zod_1.z.string().min(2).max(30),
        description: zod_1.z.string().max(500).optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }),
});
exports.updateCategorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100).optional(),
        code: zod_1.z.string().min(2).max(30).optional(),
        description: zod_1.z.string().max(500).optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }),
});
//# sourceMappingURL=category.validation.js.map