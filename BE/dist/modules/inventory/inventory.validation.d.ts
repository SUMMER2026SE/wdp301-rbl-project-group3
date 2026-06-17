import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const listInventorySchema: z.ZodObject<{
    query: z.ZodObject<{
        branchId: z.ZodOptional<z.ZodString>;
        productId: z.ZodOptional<z.ZodString>;
        lowStock: z.ZodOptional<z.ZodEnum<{
            true: "true";
            false: "false";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listImportReceiptsSchema: z.ZodObject<{
    query: z.ZodObject<{
        branchId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createImportReceiptSchema: z.ZodObject<{
    body: z.ZodObject<{
        branchId: z.ZodString;
        supplierName: z.ZodOptional<z.ZodString>;
        note: z.ZodOptional<z.ZodString>;
        items: z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            quantity: z.ZodNumber;
            unitCost: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=inventory.validation.d.ts.map