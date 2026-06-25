import { z } from 'zod';

const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must have at least 2 characters').max(200).trim(),
    subtitle: z.string().min(2, 'Subtitle must have at least 2 characters').max(200).trim(),
    description: z.string().max(500).trim().optional(),
    promoCode: z.string().max(50).trim().optional(),
    imageUrl: z.string().url('Invalid image URL').optional(), // Wait, image might be uploaded via file, so imageUrl might be added in controller. If not uploaded, we can pass url.
    linkUrl: z.string().max(500).trim().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    order: z.coerce.number().int().min(0).optional(),
  }),
});

export const updateBannerSchema = z.object({
  params: z.object({ id: mongoId }),
  body: z.object({
    title: z.string().min(2).max(200).trim().optional(),
    subtitle: z.string().min(2).max(200).trim().optional(),
    description: z.string().max(500).trim().optional(),
    promoCode: z.string().max(50).trim().optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    linkUrl: z.string().max(500).trim().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    order: z.coerce.number().int().min(0).optional(),
  }),
});

export const bannerIdParamSchema = z.object({
  params: z.object({ id: mongoId }),
});

export const listBannersSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'inactive']).optional(),
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
