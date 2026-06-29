import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const userIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    keyword: z.string().max(100).optional(),
    role: z.enum(['admin', 'branch_manager', 'staff', 'customer']).optional(),
    status: z.enum(['active', 'inactive', 'banned']).optional(),
  }),
});

const userRole = z.enum(['admin', 'branch_manager', 'staff', 'customer']);

export const changeRoleSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    role: userRole,
    branchId: objectId.optional(),
  }),
});

export { validate };
