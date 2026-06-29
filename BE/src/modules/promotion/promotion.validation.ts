import { z } from 'zod';

const dateString = z
  .string()
  .or(z.date())
  .refine((v) => !isNaN(new Date(v as string).getTime()), { message: 'Invalid date format' });

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

export const createPromotionSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).max(200).trim(),
      description: z.string().max(1000).trim().optional(),
      discountType: z.enum(['percentage', 'fixed_amount']),
      discountValue: z.number().min(0),
      maxDiscountAmount: z.number().min(0).optional(),
      minOrderAmount: z.number().min(0).optional(),
      pointCost: z.number().int().min(0).optional(),
      targetMemberLevel: z.enum(['all', 'new', 'bronze', 'silver', 'gold', 'diamond']).optional(),
      scope: z.enum(['global', 'branch']),
      branchId: mongoId.optional(),
      startDate: dateString,
      endDate: dateString,
      usageLimit: z.number().int().min(1).optional(),
      status: z.enum(['draft', 'active']).optional(),
    })
    .refine(
      (d) => d.discountType !== 'percentage' || d.discountValue <= 100,
      { message: 'Percentage discount value must be between 0 and 100', path: ['discountValue'] }
    )
    .refine(
      (d) => new Date(d.endDate as string) > new Date(d.startDate as string),
      { message: 'End date must be after start date', path: ['endDate'] }
    ),
});

export const updatePromotionSchema = z.object({
  params: z.object({ id: mongoId }),
  body: z
    .object({
      name: z.string().min(2).max(200).trim().optional(),
      description: z.string().max(1000).trim().optional(),
      discountType: z.enum(['percentage', 'fixed_amount']).optional(),
      discountValue: z.number().min(0).optional(),
      maxDiscountAmount: z.number().min(0).optional(),
      minOrderAmount: z.number().min(0).optional(),
      pointCost: z.number().int().min(0).optional(),
      targetMemberLevel: z.enum(['all', 'new', 'bronze', 'silver', 'gold', 'diamond']).optional(),
      startDate: dateString.optional(),
      endDate: dateString.optional(),
      usageLimit: z.number().int().min(1).optional(),
      status: z.enum(['draft', 'active', 'inactive']).optional(),
    })
    .refine(
      (d) => !(d.discountType === 'percentage' && d.discountValue !== undefined && d.discountValue > 100),
      { message: 'Percentage discount value must be between 0 and 100', path: ['discountValue'] }
    ),
});

export const promotionIdParamSchema = z.object({
  params: z.object({ id: mongoId }),
});

export const listPromotionsSchema = z.object({
  query: z.object({
    status: z.enum(['draft', 'active', 'inactive', 'expired']).optional(),
    scope: z.enum(['global', 'branch']).optional(),
    branchId: mongoId.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const listActivePromotionsSchema = z.object({
  query: z.object({
    branchId: mongoId.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    onlyClaimed: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  }),
});

export const claimVoucherSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Mã voucher không được để trống').trim().toUpperCase(),
  }),
});

export const generateVouchersSchema = z.object({
  params: z.object({ id: mongoId }),
  body: z.object({
    code: z.string().min(2).max(50).trim().toUpperCase(),
  }),
});

export const listVouchersSchema = z.object({
  params: z.object({ id: mongoId }),
  query: z.object({
    status: z.enum(['active', 'used', 'expired', 'disabled']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  }),
});

export const voucherIdParamSchema = z.object({
  params: z.object({ voucherId: mongoId }),
});

export const lookupVoucherSchema = z.object({
  query: z.object({
    code: z.string().min(1, 'Voucher code is required'),
    orderValue: z.coerce.number().min(0).optional(),
    branchId: mongoId.optional(),
  }),
});

export const applyVoucherSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Voucher code is required'),
    orderValue: z.number().min(0),
    branchId: mongoId.optional(),
    orderId: mongoId,
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