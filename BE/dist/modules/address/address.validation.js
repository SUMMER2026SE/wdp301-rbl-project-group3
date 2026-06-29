"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.addressIdParamSchema = exports.updateAddressSchema = exports.addAddressSchema = void 0;
const zod_1 = require("zod");
const objectIdSchema = zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
const phoneSchema = zod_1.z.string().regex(/^(0|\+84)[0-9]{8,10}$/, 'Invalid Vietnamese phone number');
exports.addAddressSchema = zod_1.z.object({
    body: zod_1.z.object({
        receiverName: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
        phoneNumber: phoneSchema,
        addressDetail: zod_1.z.string().min(10, 'Address must be at least 10 characters').max(255),
        isDefault: zod_1.z.boolean().optional(),
    }),
});
exports.updateAddressSchema = zod_1.z.object({
    params: zod_1.z.object({ addressId: objectIdSchema }),
    body: zod_1.z
        .object({
        receiverName: zod_1.z.string().min(2).max(100).optional(),
        phoneNumber: phoneSchema.optional(),
        addressDetail: zod_1.z.string().min(10).max(255).optional(),
    })
        .refine((d) => d.receiverName !== undefined ||
        d.phoneNumber !== undefined ||
        d.addressDetail !== undefined, { message: 'At least one field must be provided' }),
});
exports.addressIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ addressId: objectIdSchema }),
});
const validate = (schema) => (req, _res, next) => {
    try {
        schema.parse({ body: req.body, query: req.query, params: req.params });
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validate = validate;
//# sourceMappingURL=address.validation.js.map