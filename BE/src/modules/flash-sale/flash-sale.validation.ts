import { z } from 'zod';

const dateString = z
  .string()
  .or(z.date())
  .refine((v) => !isNaN(new Date(v as string).getTime()), { message: 'Invalid date format' });

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

const flashSaleProductSchema = z.object({
  productId: mongoId,
  flashSalePrice: z.number().min(0),
  limitQuantity: z.number().int().min(1),
});

export const createFlashSaleSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).max(200).trim(),
      description: z.string().max(1000).trim().optional(),
      startDate: dateString,
      endDate: dateString,
      scope: z.enum(['global', 'branch']),
      branchId: mongoId.optional(),
      products: z.array(flashSaleProductSchema).min(1, 'At least one product is required'),
      status: z.enum(['draft', 'active', 'inactive']).optional(),
    })
    .refine(
      (d) => new Date(d.endDate as string) > new Date(d.startDate as string),
      { message: 'End date must be after start date', path: ['endDate'] }
    )
    .refine(
      (d) => d.scope !== 'branch' || !!d.branchId,
      { message: 'Branch ID is required when scope is branch', path: ['branchId'] }
    ),
});

export const updateFlashSaleSchema = z.object({
  params: z.object({ id: mongoId }),
  body: z
    .object({
      name: z.string().min(2).max(200).trim().optional(),
      description: z.string().max(1000).trim().optional(),
      startDate: dateString.optional(),
      endDate: dateString.optional(),
      scope: z.enum(['global', 'branch']).optional(),
      branchId: mongoId.optional(),
      products: z.array(flashSaleProductSchema).min(1).optional(),
      status: z.enum(['draft', 'active', 'inactive']).optional(),
    })
    .refine(
      (d) => {
        if (d.startDate && d.endDate) {
          return new Date(d.endDate as string) > new Date(d.startDate as string);
        }
        return true;
      },
      { message: 'End date must be after start date', path: ['endDate'] }
    ),
});

export const flashSaleIdParamSchema = z.object({
  params: z.object({ id: mongoId }),
});

export const listFlashSalesSchema = z.object({
  query: z.object({
    status: z.enum(['draft', 'active', 'inactive', 'expired']).optional(),
    scope: z.enum(['global', 'branch']).optional(),
    branchId: mongoId.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

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
