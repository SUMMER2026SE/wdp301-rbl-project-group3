import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === '' || val === null || val === undefined ? undefined : val), schema);

export const productIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const listProductsSchema = z
  .object({
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(10000).default(10),
      status: z.enum(['active', 'inactive']).optional(),
      keyword: z.string().max(100).optional(),
      categoryId: objectId.optional(),
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),
      branchId: objectId.optional(),
    }),
  })
  .refine(
    (data) => {
      const { minPrice, maxPrice } = data.query;
      if (minPrice !== undefined && maxPrice !== undefined) {
        return minPrice <= maxPrice;
      }
      return true;
    },
    { message: 'minPrice must be less than or equal to maxPrice' }
  );

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    sku: z.string().min(2).max(50),
    description: emptyToUndefined(z.string().max(1000).optional()),
    categoryId: emptyToUndefined(objectId.optional()),
    unit: emptyToUndefined(z.string().min(1).max(30).optional()),
    salePrice: z.coerce.number().min(0).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    sku: z.string().min(2).max(50).optional(),
    description: emptyToUndefined(z.string().max(1000).optional()),
    categoryId: emptyToUndefined(objectId.optional()),
    unit: emptyToUndefined(z.string().min(1).max(30).optional()),
    salePrice: z.coerce.number().min(0).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export { validate };
