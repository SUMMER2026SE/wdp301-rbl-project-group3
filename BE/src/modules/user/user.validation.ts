import { z } from 'zod';
import { validate } from '../auth/auth.validation';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
});

export { validate };