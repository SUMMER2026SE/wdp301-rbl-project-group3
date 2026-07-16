import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const addAddressSchema: z.ZodObject<{
    body: z.ZodObject<{
        receiverName: z.ZodString;
        phoneNumber: z.ZodString;
        addressDetail: z.ZodString;
        isDefault: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateAddressSchema: z.ZodObject<{
    params: z.ZodObject<{
        addressId: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        receiverName: z.ZodOptional<z.ZodString>;
        phoneNumber: z.ZodOptional<z.ZodString>;
        addressDetail: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const addressIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        addressId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const validate: <T extends z.ZodTypeAny>(schema: T) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=address.validation.d.ts.map