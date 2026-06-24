import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const returnStatus = z.enum([
  'pending',
  'approved',
  'completing',
  'completed',
  'rejected',
  'cancelled',
]);
const returnItem = z.object({
  productId: objectId,
  quantity: z.number().int().min(1),
  condition: z.enum(['resellable', 'damaged', 'expired']),
});

function uniqueProducts(
  items: { productId: string }[],
  context: z.RefinementCtx
): void {
  const ids = items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['items'],
      message: 'Each product can appear only once in a return request',
    });
  }
}

export const returnIdParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const listReturnsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    branchId: objectId.optional(),
    orderId: objectId.optional(),
    customerId: objectId.optional(),
    status: returnStatus.optional(),
  }),
});

export const createReturnSchema = z.object({
  body: z.object({
    orderId: objectId,
    reason: z.string().trim().min(3).max(500),
    items: z.array(returnItem).min(1).superRefine(uniqueProducts),
  }),
});

export const updateReturnSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      reason: z.string().trim().min(3).max(500).optional(),
      items: z.array(returnItem).min(1).superRefine(uniqueProducts).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

export const cancelReturnSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    reason: z.string().trim().min(3).max(500),
  }),
});

export const resolveReturnSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    note: z.string().trim().max(500).optional(),
  }),
});

export const rejectReturnSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    note: z.string().trim().min(3).max(500),
  }),
});

export const completeReturnSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      refundMethod: z.enum([
        'cash',
        'bank_transfer',
        'original_payment',
        'other',
      ]),
      refundReference: z.string().trim().max(150).optional(),
    })
    .superRefine((body, context) => {
      if (
        ['bank_transfer', 'original_payment'].includes(body.refundMethod) &&
        !body.refundReference
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['refundReference'],
          message: 'refundReference is required for this refund method',
        });
      }
    }),
});

export { validate };
