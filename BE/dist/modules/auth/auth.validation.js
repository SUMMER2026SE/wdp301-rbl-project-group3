"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.changePasswordWithOtpSchema = exports.verifyEmailOtpSchema = exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.googleLoginSchema = exports.loginSchema = exports.resendEmailOtpSchema = exports.verifyEmailSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
const otpSchema = zod_1.z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers');
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').max(100),
        email: zod_1.z.string().email('Invalid email format'),
        password: passwordSchema,
        phone: zod_1.z.string().optional(),
    }),
});
// Xác thực email sau khi đăng ký — dùng OTP + email (không cần đăng nhập)
exports.verifyEmailSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        otp: otpSchema,
    }),
});
// Gửi lại OTP xác thực email (không cần đăng nhập)
exports.resendEmailOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.googleLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        idToken: zod_1.z.string().min(1, 'Google ID token is required'),
    }),
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
    }),
});
// Reset password sau forgot password — dùng OTP thay vì link token
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        otp: otpSchema,
        newPassword: passwordSchema,
    }),
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: passwordSchema,
    }),
});
// Xác thực email OTP khi đã đăng nhập
exports.verifyEmailOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        otp: otpSchema,
    }),
});
// Đổi mật khẩu bằng OTP khi đã đăng nhập
exports.changePasswordWithOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        otp: otpSchema,
        newPassword: passwordSchema,
    }),
});
const validate = (schema) => {
    return (req, _res, next) => {
        try {
            schema.parse({ body: req.body, query: req.query, params: req.params });
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=auth.validation.js.map