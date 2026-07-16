"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.approveRejectShiftSchema = exports.registerShiftSchema = exports.updateShiftTemplateSchema = exports.createShiftTemplateSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
const objectId = zod_1.z.string().refine((val) => mongoose_1.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
});
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
exports.createShiftTemplateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        startTime: zod_1.z.string().regex(timeRegex, { message: 'startTime must be in HH:MM format' }),
        endTime: zod_1.z.string().regex(timeRegex, { message: 'endTime must be in HH:MM format' }),
        maxStaff: zod_1.z.number().int().min(1).default(3),
    }),
});
exports.updateShiftTemplateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        startTime: zod_1.z.string().regex(timeRegex, { message: 'startTime must be in HH:MM format' }).optional(),
        endTime: zod_1.z.string().regex(timeRegex, { message: 'endTime must be in HH:MM format' }).optional(),
        maxStaff: zod_1.z.number().int().min(1).optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }),
});
exports.registerShiftSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date string',
        }),
        shiftTemplateId: objectId,
        note: zod_1.z.string().max(500).optional(),
    }),
});
exports.approveRejectShiftSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['approved', 'rejected']),
        managerNote: zod_1.z.string().max(500).optional(),
    }),
});
var auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
//# sourceMappingURL=shift.validation.js.map