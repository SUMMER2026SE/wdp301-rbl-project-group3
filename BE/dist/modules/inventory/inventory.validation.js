"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.createImportReceiptSchema = exports.listImportReceiptsSchema = exports.listInventorySchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
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
    }),
});
exports.createImportReceiptSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: objectId,
        supplierName: zod_1.z.string().max(150).optional(),
        note: zod_1.z.string().max(500).optional(),
        items: zod_1.z
            .array(zod_1.z.object({
            productId: objectId,
            quantity: zod_1.z.number().int().min(1),
            unitCost: zod_1.z.number().min(0),
        }))
            .min(1),
    }),
});
//# sourceMappingURL=inventory.validation.js.map