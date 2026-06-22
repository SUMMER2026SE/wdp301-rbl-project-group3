import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const userIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listUsersSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        keyword: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodEnum<{
            admin: "admin";
            branch_manager: "branch_manager";
            staff: "staff";
            customer: "customer";
        }>>;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            inactive: "inactive";
            banned: "banned";
        }>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=admin-user.validation.d.ts.map