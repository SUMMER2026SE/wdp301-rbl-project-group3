"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.completeReturnSchema = exports.rejectReturnSchema = exports.resolveReturnSchema = exports.cancelReturnSchema = exports.updateReturnSchema = exports.createReturnSchema = exports.listReturnsSchema = exports.returnIdParamSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const returnStatus = zod_1.z.enum([
    'pending',
    'approved',
    'completing',
    'completed',
    'rejected',
    'cancelled',
]);
const returnItem = zod_1.z.object({
    productId: objectId,
    quantity: zod_1.z.number().int().min(1),
    condition: zod_1.z.enum(['resellable', 'damaged', 'expired']),
});
function uniqueProducts(items, context) {
    const ids = items.map((item) => item.productId);
    if (new Set(ids).size !== ids.length) {
        context.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['items'],
            message: 'Each product can appear only once in a return request',
        });
    }
}
exports.returnIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: objectId }),
});
exports.listReturnsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
        branchId: objectId.optional(),
        orderId: objectId.optional(),
        customerId: objectId.optional(),
        status: returnStatus.optional(),
    }),
});
exports.createReturnSchema = zod_1.z.object({
    body: zod_1.z.object({
        orderId: objectId,
        reason: zod_1.z.string().trim().min(3).max(500),
        items: zod_1.z.array(returnItem).min(1).superRefine(uniqueProducts),
    }),
});
exports.updateReturnSchema = zod_1.z.object({
    params: zod_1.z.object({ id: objectId }),
    body: zod_1.z
        .object({
        reason: zod_1.z.string().trim().min(3).max(500).optional(),
        items: zod_1.z.array(returnItem).min(1).superRefine(uniqueProducts).optional(),
    })
        .refine((body) => Object.keys(body).length > 0, {
        message: 'At least one field is required',
    }),
});
exports.cancelReturnSchema = zod_1.z.object({
    params: zod_1.z.object({ id: objectId }),
    body: zod_1.z.object({
        reason: zod_1.z.string().trim().min(3).max(500),
    }),
});
exports.resolveReturnSchema = zod_1.z.object({
    params: zod_1.z.object({ id: objectId }),
    body: zod_1.z.object({
        note: zod_1.z.string().trim().max(500).optional(),
    }),
});
exports.rejectReturnSchema = zod_1.z.object({
    params: zod_1.z.object({ id: objectId }),
    body: zod_1.z.object({
        note: zod_1.z.string().trim().min(3).max(500),
    }),
});
exports.completeReturnSchema = zod_1.z.object({
    params: zod_1.z.object({ id: objectId }),
    body: zod_1.z
        .object({
        refundMethod: zod_1.z.enum([
            'cash',
            'bank_transfer',
            'original_payment',
            'other',
        ]),
        refundReference: zod_1.z.string().trim().max(150).optional(),
    })
        .superRefine((body, context) => {
        if (['bank_transfer', 'original_payment'].includes(body.refundMethod) &&
            !body.refundReference) {
            context.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['refundReference'],
                message: 'refundReference is required for this refund method',
            });
        }
    }),
});
//# sourceMappingURL=return.validation.js.map