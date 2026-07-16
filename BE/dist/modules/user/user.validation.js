"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z
            .string()
            .min(2, 'Full name must be at least 2 characters')
            .max(100, 'Full name must not exceed 100 characters')
            .trim()
            .optional(),
        phone: zod_1.z
            .string()
            .trim()
            .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Invalid phone number format')
            .optional()
            .or(zod_1.z.literal('')),
        address: zod_1.z
            .string()
            .trim()
            .max(255, 'Address must not exceed 255 characters')
            .optional()
            .or(zod_1.z.literal('')),
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
//# sourceMappingURL=user.validation.js.map