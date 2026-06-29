import { z } from 'zod';

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

const isoDate = z
  .string()
  .refine((v) => !isNaN(new Date(v).getTime()), { message: 'Invalid date format. Use ISO 8601' });

const groupBySchema = z.enum(['day', 'month']);

// ─── Admin ────────────────────────────────────────────────────────────────────

export const trendQuerySchema = z.object({
  query: z.object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    groupBy: groupBySchema.optional(),
  }),
});

export const topPromotionsQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

// ─── Branch ───────────────────────────────────────────────────────────────────

export const branchOverviewQuerySchema = z.object({
  query: z.object({
    branchId: mongoId.optional(),
  }),
});

export const branchTrendQuerySchema = z.object({
  query: z.object({
    branchId: mongoId.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    groupBy: groupBySchema.optional(),
  }),
});

// ─── Personal ──────────────────────────────────────────────────────────────────

export const myStatsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

// ─── Validate middleware ───────────────────────────────────────────────────────

export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return (
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction
  ) => {
    try {
      schema.parse({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (error) {
      next(error);
    }
  };
};