"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.updateInventorySchema = exports.createInventorySchema = exports.inventoryIdParamSchema = exports.updateImportReceiptSchema = exports.createImportReceiptSchema = exports.listImportReceiptsSchema = exports.listInventorySchema = exports.importReceiptIdParamSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const importItemSchema = zod_1.z.object({
    productId: objectId,
    quantity: zod_1.z.number().int().min(1),
    unitCost: zod_1.z.number().min(0),
});
const uniqueImportItems = (items, context) => {
    const productIds = items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
        context.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Each product can appear only once in an import receipt',
            path: ['items'],
        });
    }
};
exports.importReceiptIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
});
exports.listInventorySchema = zod_1.z.object({
    query: zod_1.z.object({
        branchId: objectId.optional(),
        productId: objectId.optional(),
        lowStock: zod_1.z.enum(['true', 'false']).optional(),
    }),
});
exports.listImportReceiptsSchema = zod_1.z.object({
    query: zod_1.z.object({
        branchId: objectId.optional(),
        status: zod_1.z.enum(['active', 'cancelled']).optional(),
    }),
});
exports.createImportReceiptSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: objectId,
        supplierName: zod_1.z.string().max(150).optional(),
        note: zod_1.z.string().max(500).optional(),
        items: zod_1.z.array(importItemSchema).min(1).superRefine(uniqueImportItems),
    }),
});
exports.updateImportReceiptSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
    body: zod_1.z
        .object({
        branchId: objectId.optional(),
        supplierName: zod_1.z.string().max(150).optional(),
        note: zod_1.z.string().max(500).optional(),
        items: zod_1.z.array(importItemSchema).min(1).superRefine(uniqueImportItems).optional(),
    })
        .refine((body) => Object.keys(body).length > 0, {
        message: 'At least one field is required',
    }),
});
exports.inventoryIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
});
exports.createInventorySchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: objectId,
        productId: objectId,
        quantity: zod_1.z.number().int().min(0).default(0),
        averageCost: zod_1.z.number().min(0).default(0),
        lowStockThreshold: zod_1.z.number().int().min(0).default(10),
    }),
});
exports.updateInventorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
    body: zod_1.z.object({
        quantity: zod_1.z.number().int().min(0).optional(),
        averageCost: zod_1.z.number().min(0).optional(),
        lowStockThreshold: zod_1.z.number().int().min(0).optional(),
    }).refine((body) => Object.keys(body).length > 0, {
        message: 'At least one field is required',
    }),
});
//# sourceMappingURL=inventory.validation.js.map