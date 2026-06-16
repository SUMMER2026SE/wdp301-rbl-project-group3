import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const listInventorySchema = z.object({
  query: z.object({
    branchId: objectId.optional(),
    productId: objectId.optional(),
    lowStock: z.enum(['true', 'false']).optional(),
  }),
});

export const listImportReceiptsSchema = z.object({
  query: z.object({
    branchId: objectId.optional(),
  }),
});

export const createImportReceiptSchema = z.object({
  body: z.object({
    branchId: objectId,
    supplierName: z.string().max(150).optional(),
    note: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          productId: objectId,
          quantity: z.number().int().min(1),
          unitCost: z.number().min(0),
        })
      )
      .min(1),
  }),
});

export { validate };
