import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .trim()
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Invalid phone number format')
      .optional()
      .or(z.literal('')),
    address: z
      .string()
      .trim()
      .max(255, 'Address must not exceed 255 characters')
      .optional()
      .or(z.literal('')),
  }),
});

export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return (
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction
  ) => {
    try {
      schema.parse({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (error) {
      next(error);
    }
  };
};