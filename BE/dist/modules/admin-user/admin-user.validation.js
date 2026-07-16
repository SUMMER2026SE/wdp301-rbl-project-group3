"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.changeRoleSchema = exports.listUsersSchema = exports.userIdParamSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
exports.userIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
});
exports.listUsersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
        keyword: zod_1.z.string().max(100).optional(),
        role: zod_1.z.enum(['admin', 'branch_manager', 'staff', 'customer']).optional(),
        status: zod_1.z.enum(['active', 'inactive', 'banned']).optional(),
    }),
});
const userRole = zod_1.z.enum(['admin', 'branch_manager', 'staff', 'customer']);
exports.changeRoleSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
    body: zod_1.z.object({
        role: userRole,
        branchId: objectId.optional(),
    }),
});
//# sourceMappingURL=admin-user.validation.js.map