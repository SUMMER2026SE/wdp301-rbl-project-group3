import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const importItemSchema = z.object({
  productId: objectId,
  quantity: z.number().int().min(1),
  unitCost: z.number().min(0),
});

const uniqueImportItems = (
  items: { productId: string }[],
  context: z.RefinementCtx
) => {
  const productIds = items.map((item) => item.productId);
  if (new Set(productIds).size !== productIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Each product can appear only once in an import receipt',
      path: ['items'],
    });
  }
};

export const importReceiptIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

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
    status: z.enum(['active', 'cancelled']).optional(),
  }),
});

export const createImportReceiptSchema = z.object({
  body: z.object({
    branchId: objectId,
    supplierName: z.string().max(150).optional(),
    note: z.string().max(500).optional(),
    items: z.array(importItemSchema).min(1).superRefine(uniqueImportItems),
  }),
});

export const updateImportReceiptSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      branchId: objectId.optional(),
      supplierName: z.string().max(150).optional(),
      note: z.string().max(500).optional(),
      items: z.array(importItemSchema).min(1).superRefine(uniqueImportItems).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

export { validate };
