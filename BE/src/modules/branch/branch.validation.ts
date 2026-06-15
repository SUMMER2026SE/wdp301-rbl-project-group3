import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const branchIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const listBranchesSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'inactive']).optional(),
    keyword: z.string().max(100).optional(),
  }),
});

export const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    code: z.string().min(2).max(30),
    address: z.string().min(5).max(255),
    phone: z.string().max(20).optional(),
    managerId: objectId.optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const updateBranchSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    code: z.string().min(2).max(30).optional(),
    address: z.string().min(5).max(255).optional(),
    phone: z.string().max(20).optional(),
    managerId: objectId.optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export { validate };
