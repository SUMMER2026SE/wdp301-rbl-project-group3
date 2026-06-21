"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.updateBranchSchema = exports.createBranchSchema = exports.listBranchesSchema = exports.branchIdParamSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
exports.branchIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
});
exports.listBranchesSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['active', 'inactive']).optional(),
        keyword: zod_1.z.string().max(100).optional(),
    }),
});
exports.createBranchSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100),
        code: zod_1.z.string().min(2).max(30),
        address: zod_1.z.string().min(5).max(255),
        phone: zod_1.z.string().max(20).optional(),
        managerId: objectId.optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }),
});
exports.updateBranchSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100).optional(),
        code: zod_1.z.string().min(2).max(30).optional(),
        address: zod_1.z.string().min(5).max(255).optional(),
        phone: zod_1.z.string().max(20).optional(),
        managerId: objectId.optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }),
});
//# sourceMappingURL=branch.validation.js.map