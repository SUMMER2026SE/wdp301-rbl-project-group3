import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    body: z.ZodObject<{
        fullName: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const verifyEmailSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        otp: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const resendEmailOtpSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const googleLoginSchema: z.ZodObject<{
    body: z.ZodObject<{
        idToken: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const forgotPasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const resetPasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        otp: z.ZodString;
        newPassword: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const changePasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        currentPassword: z.ZodString;
        newPassword: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const verifyEmailOtpSchema: z.ZodObject<{
    body: z.ZodObject<{
        otp: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const changePasswordWithOtpSchema: z.ZodObject<{
    body: z.ZodObject<{
        otp: z.ZodString;
        newPassword: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const validate: <T extends z.ZodTypeAny>(schema: T) => (req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=auth.validation.d.ts.map