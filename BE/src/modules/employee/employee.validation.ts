import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const employeeRole = z.enum(['branch_manager', 'staff']);
const employeeStatus = z.enum(['active', 'inactive', 'banned']);
const phone = z.string().trim().regex(/^[0-9+()\-\s]{8,20}$/, 'Invalid phone number');

export const employeeIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const listEmployeesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    keyword: z.string().trim().max(100).optional(),
    branchId: objectId.optional(),
    role: employeeRole.optional(),
    status: employeeStatus.optional(),
  }),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(150),
    password: z.string().min(8).max(128),
    phone: phone.optional(),
    address: z.string().trim().max(255).optional(),
    role: employeeRole.default('staff'),
    branchId: objectId,
    status: z.enum(['active', 'inactive']).default('active'),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      fullName: z.string().trim().min(2).max(100).optional(),
      email: z.string().trim().email().max(150).optional(),
      password: z.string().min(8).max(128).optional(),
      phone: phone.nullable().optional(),
      address: z.string().trim().max(255).nullable().optional(),
      role: employeeRole.optional(),
      branchId: objectId.optional(),
      status: employeeStatus.optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

export { validate };
