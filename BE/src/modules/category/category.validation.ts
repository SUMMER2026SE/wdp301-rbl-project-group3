import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const listCategoriesSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'inactive']).optional(),
    keyword: z.string().max(100).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    code: z.string().min(2).max(30),
    description: z.string().max(500).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    code: z.string().min(2).max(30).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export { validate };
