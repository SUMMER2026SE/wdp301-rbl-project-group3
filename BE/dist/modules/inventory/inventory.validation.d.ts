import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const importReceiptIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
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
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            cancelled: "cancelled";
        }>>;
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
export declare const updateImportReceiptSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        branchId: z.ZodOptional<z.ZodString>;
        supplierName: z.ZodOptional<z.ZodString>;
        note: z.ZodOptional<z.ZodString>;
        items: z.ZodOptional<z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            quantity: z.ZodNumber;
            unitCost: z.ZodNumber;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const inventoryIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createInventorySchema: z.ZodObject<{
    body: z.ZodObject<{
        branchId: z.ZodString;
        productId: z.ZodString;
        quantity: z.ZodDefault<z.ZodNumber>;
        averageCost: z.ZodDefault<z.ZodNumber>;
        lowStockThreshold: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateInventorySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        quantity: z.ZodOptional<z.ZodNumber>;
        averageCost: z.ZodOptional<z.ZodNumber>;
        lowStockThreshold: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=inventory.validation.d.ts.map