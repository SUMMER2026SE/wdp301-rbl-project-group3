"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const auth_validation_1 = require("../auth/auth.validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return auth_validation_1.validate; } });
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(100).optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=user.validation.js.map