import { z } from 'zod';
export declare const createShiftTemplateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        startTime: z.ZodString;
        endTime: z.ZodString;
        maxStaff: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateShiftTemplateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
        maxStaff: z.ZodOptional<z.ZodNumber>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const registerShiftSchema: z.ZodObject<{
    body: z.ZodObject<{
        date: z.ZodString;
        shiftTemplateId: z.ZodString;
        note: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const approveRejectShiftSchema: z.ZodObject<{
    body: z.ZodObject<{
        status: z.ZodEnum<{
            approved: "approved";
            rejected: "rejected";
        }>;
        managerNote: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate } from '../auth/auth.validation';
//# sourceMappingURL=shift.validation.d.ts.map