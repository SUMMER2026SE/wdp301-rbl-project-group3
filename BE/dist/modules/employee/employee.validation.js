"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.updateEmployeeSchema = exports.createEmployeeSchema = exports.listEmployeesSchema = exports.employeeIdParamSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const employeeRole = zod_1.z.enum(['branch_manager', 'staff']);
const employeeStatus = zod_1.z.enum(['active', 'inactive', 'banned']);
const phone = zod_1.z.string().trim().regex(/^[0-9+()\-\s]{8,20}$/, 'Invalid phone number');
exports.employeeIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: objectId }),
});
exports.listEmployeesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
        keyword: zod_1.z.string().trim().max(100).optional(),
        branchId: objectId.optional(),
        role: employeeRole.optional(),
        status: employeeStatus.optional(),
    }),
});
exports.createEmployeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().trim().min(2).max(100),
        email: zod_1.z.string().trim().email().max(150),
        password: zod_1.z.string().min(8).max(128),
        phone: phone.optional(),
        address: zod_1.z.string().trim().max(255).optional(),
        role: employeeRole.default('staff'),
        branchId: objectId,
        status: zod_1.z.enum(['active', 'inactive']).default('active'),
    }),
});
exports.updateEmployeeSchema = zod_1.z.object({
    params: zod_1.z.object({ id: objectId }),
    body: zod_1.z
        .object({
        fullName: zod_1.z.string().trim().min(2).max(100).optional(),
        email: zod_1.z.string().trim().email().max(150).optional(),
        password: zod_1.z.string().min(8).max(128).optional(),
        phone: phone.nullable().optional(),
        address: zod_1.z.string().trim().max(255).nullable().optional(),
        role: employeeRole.optional(),
        branchId: objectId.optional(),
        status: employeeStatus.optional(),
    })
        .refine((body) => Object.keys(body).length > 0, {
        message: 'At least one field is required',
    }),
});
//# sourceMappingURL=employee.validation.js.map