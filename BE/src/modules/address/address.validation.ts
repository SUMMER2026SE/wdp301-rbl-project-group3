import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
const phoneSchema = z.string().regex(/^(0|\+84)[0-9]{8,10}$/, 'Invalid Vietnamese phone number');

export const addAddressSchema = z.object({
    body: z.object({
        receiverName: z.string().min(2, 'Name must be at least 2 characters').max(100),
        phoneNumber: phoneSchema,
        addressDetail: z.string().min(10, 'Address must be at least 10 characters').max(255),
        isDefault: z.boolean().optional(),
    }),
});

export const updateAddressSchema = z.object({
    params: z.object({ addressId: objectIdSchema }),
    body: z
        .object({
            receiverName: z.string().min(2).max(100).optional(),
            phoneNumber: phoneSchema.optional(),
            addressDetail: z.string().min(10).max(255).optional(),
        })
        .refine(
            (d) =>
                d.receiverName !== undefined ||
                d.phoneNumber !== undefined ||
                d.addressDetail !== undefined,
            { message: 'At least one field must be provided' }
        ),
});

export const addressIdParamSchema = z.object({
    params: z.object({ addressId: objectIdSchema }),
});

export const validate = <T extends z.ZodTypeAny>(schema: T) =>
    (req: Request, _res: Response, next: NextFunction) => {
        try {
            schema.parse({ body: req.body, query: req.query, params: req.params });
            next();
        } catch (error) {
            next(error);
        }
    };
