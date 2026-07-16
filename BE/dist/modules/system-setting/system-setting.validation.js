"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.bulkUpdateSettingsSchema = exports.updateSettingSchema = exports.createSettingSchema = exports.listSettingsSchema = exports.settingKeyParamSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const settingKey = zod_1.z
    .string()
    .regex(/^[a-z][a-z0-9_]{1,49}$/, 'Key must be lowercase snake_case (2-50 chars)');
const settingGroup = zod_1.z.enum(['general', 'order', 'delivery', 'inventory', 'payment', 'notification']);
const settingValueType = zod_1.z.enum(['string', 'number', 'boolean']);
exports.settingKeyParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        key: settingKey,
    }),
});
exports.listSettingsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
        group: settingGroup.optional(),
        keyword: zod_1.z.string().max(100).optional(),
        isPublic: zod_1.z
            .enum(['true', 'false'])
            .transform((value) => value === 'true')
            .optional(),
    }),
});
exports.createSettingSchema = zod_1.z.object({
    body: zod_1.z.object({
        key: settingKey,
        label: zod_1.z.string().min(2).max(100),
        group: settingGroup,
        value: zod_1.z.union([zod_1.z.string().max(500), zod_1.z.number(), zod_1.z.boolean()]),
        valueType: settingValueType,
        description: zod_1.z.string().max(500).optional(),
        isPublic: zod_1.z.boolean().optional(),
    }),
});
exports.updateSettingSchema = zod_1.z.object({
    params: zod_1.z.object({
        key: settingKey,
    }),
    body: zod_1.z.object({
        label: zod_1.z.string().min(2).max(100).optional(),
        group: settingGroup.optional(),
        value: zod_1.z.union([zod_1.z.string().max(500), zod_1.z.number(), zod_1.z.boolean()]).optional(),
        valueType: settingValueType.optional(),
        description: zod_1.z.string().max(500).optional(),
        isPublic: zod_1.z.boolean().optional(),
    }),
});
exports.bulkUpdateSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        settings: zod_1.z
            .array(zod_1.z.object({
            key: settingKey,
            value: zod_1.z.union([zod_1.z.string().max(500), zod_1.z.number(), zod_1.z.boolean()]),
        }))
            .min(1)
            .max(50),
    }),
});
//# sourceMappingURL=system-setting.validation.js.map