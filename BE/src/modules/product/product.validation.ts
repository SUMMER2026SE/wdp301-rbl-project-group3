import { z } from 'zod';
import { validate } from '../auth/auth.validation';

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(['active', 'inactive']).optional(),
    keyword: z.string().max(100).optional(),
  }),
});

export { validate };
