"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.cancelOrderSchema = exports.myOrderIdParamSchema = exports.myOrdersSchema = exports.updateOrderStatusSchema = exports.listOrdersSchema = exports.orderIdParamSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const orderStatus = zod_1.z.enum(['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled']);
exports.orderIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
});
exports.listOrdersSchema = zod_1.z.object({
    query: zod_1.z.object({
        branchId: objectId.optional(),
        status: orderStatus.optional(),
    }),
});
exports.updateOrderStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectId,
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['confirmed', 'preparing', 'delivering', 'delivered', 'cancelled']),
    }),
});
exports.myOrdersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        status: orderStatus.optional(),
    }),
});
exports.myOrderIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ orderId: objectId }),
});
exports.cancelOrderSchema = zod_1.z.object({
    params: zod_1.z.object({ orderId: objectId }),
    body: zod_1.z.object({
        reason: zod_1.z.string().max(255).optional(),
    }),
});
//# sourceMappingURL=order.validation.js.map