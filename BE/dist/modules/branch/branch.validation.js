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
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const dayEnum = zod_1.z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
exports.createBranchSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100),
        code: zod_1.z.string().min(2).max(30),
        address: zod_1.z.string().min(5).max(255),
        phone: zod_1.z.string().max(20).optional(),
        managerId: objectId.optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
        openingTime: zod_1.z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
        closingTime: zod_1.z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
        activeDays: zod_1.z.array(dayEnum).optional(),
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
        openingTime: zod_1.z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
        closingTime: zod_1.z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
        activeDays: zod_1.z.array(dayEnum).optional(),
    }),
});
//# sourceMappingURL=branch.validation.js.map