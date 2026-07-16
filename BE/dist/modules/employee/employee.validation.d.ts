import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const employeeIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listEmployeesSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        keyword: z.ZodOptional<z.ZodString>;
        branchId: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodEnum<{
            branch_manager: "branch_manager";
            staff: "staff";
        }>>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
            banned: "banned";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createEmployeeSchema: z.ZodObject<{
    body: z.ZodObject<{
        fullName: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        role: z.ZodDefault<z.ZodEnum<{
            branch_manager: "branch_manager";
            staff: "staff";
        }>>;
        branchId: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateEmployeeSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        fullName: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role: z.ZodOptional<z.ZodEnum<{
            branch_manager: "branch_manager";
            staff: "staff";
        }>>;
        branchId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
            banned: "banned";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=employee.validation.d.ts.map