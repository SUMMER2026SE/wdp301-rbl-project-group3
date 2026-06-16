import { z } from 'zod';
import { validate } from '../auth/auth.validation';

export const listProductsSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'inactive']).optional(),
    keyword: z.string().max(100).optional(),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    sku: z.string().min(2).max(50),
    description: z.string().max(1000).optional(),
    unit: z.string().min(1).max(30).optional(),
    salePrice: z.number().min(0).optional(),
    imageUrl: z.string().url().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export { validate };
