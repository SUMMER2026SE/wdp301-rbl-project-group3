import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const orderStatus = z.enum(['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled']);

export const orderIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    branchId: objectId.optional(),
    status: orderStatus.optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    status: z.enum(['confirmed', 'preparing', 'delivering', 'delivered', 'cancelled']),
  }),
});

export const myOrdersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    status: orderStatus.optional(),
  }),
});

export const myOrderIdParamSchema = z.object({
  params: z.object({ orderId: objectId }),
});

export const cancelOrderSchema = z.object({
  params: z.object({ orderId: objectId }),
  body: z.object({
    reason: z.string().max(255).optional(),
  }),
});

export { validate };
