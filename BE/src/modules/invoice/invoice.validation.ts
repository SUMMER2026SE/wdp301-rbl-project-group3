import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const invoiceIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const invoiceOrderIdParamSchema = z.object({
  params: z.object({ orderId: objectId }),
});

export { validate };
