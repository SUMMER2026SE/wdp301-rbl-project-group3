import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const branchIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listBranchesSchema: z.ZodObject<{
    query: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
        keyword: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createBranchSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        code: z.ZodString;
        address: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        managerId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
        openingTime: z.ZodOptional<z.ZodString>;
        closingTime: z.ZodOptional<z.ZodString>;
        activeDays: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            Monday: "Monday";
            Tuesday: "Tuesday";
            Wednesday: "Wednesday";
            Thursday: "Thursday";
            Friday: "Friday";
            Saturday: "Saturday";
            Sunday: "Sunday";
        }>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateBranchSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        code: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        managerId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
        openingTime: z.ZodOptional<z.ZodString>;
        closingTime: z.ZodOptional<z.ZodString>;
        activeDays: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            Monday: "Monday";
            Tuesday: "Tuesday";
            Wednesday: "Wednesday";
            Thursday: "Thursday";
            Friday: "Friday";
            Saturday: "Saturday";
            Sunday: "Sunday";
        }>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=branch.validation.d.ts.map