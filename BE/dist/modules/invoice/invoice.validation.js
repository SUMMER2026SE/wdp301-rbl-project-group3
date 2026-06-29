"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.invoiceOrderIdParamSchema = exports.invoiceIdParamSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
exports.invoiceIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: objectId }),
});
exports.invoiceOrderIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ orderId: objectId }),
});
//# sourceMappingURL=invoice.validation.js.map