"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.myStatsQuerySchema = exports.branchTrendQuerySchema = exports.branchOverviewQuerySchema = exports.topPromotionsQuerySchema = exports.trendQuerySchema = void 0;
const zod_1 = require("zod");
const mongoId = zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
const isoDate = zod_1.z
    .string()
    .refine((v) => !isNaN(new Date(v).getTime()), { message: 'Invalid date format. Use ISO 8601' });
const groupBySchema = zod_1.z.enum(['day', 'month']);
// ─── Admin ────────────────────────────────────────────────────────────────────
exports.trendQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        from: isoDate.optional(),
        to: isoDate.optional(),
        groupBy: groupBySchema.optional(),
    }),
});
exports.topPromotionsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        limit: zod_1.z.coerce.number().int().min(1).max(50).optional(),
    }),
});
// ─── Branch ───────────────────────────────────────────────────────────────────
exports.branchOverviewQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        branchId: mongoId.optional(),
    }),
});
exports.branchTrendQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        branchId: mongoId.optional(),
        from: isoDate.optional(),
        to: isoDate.optional(),
        groupBy: groupBySchema.optional(),
    }),
});
// ─── Personal ──────────────────────────────────────────────────────────────────
exports.myStatsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).optional(),
    }),
});
// ─── Validate middleware ───────────────────────────────────────────────────────
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
//# sourceMappingURL=statistics.validation.js.map