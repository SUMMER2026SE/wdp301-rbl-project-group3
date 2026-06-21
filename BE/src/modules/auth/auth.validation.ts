import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d+$/, 'OTP must contain only numbers');

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
    phone: z.string().optional(),
  }),
});

// Xác thực email sau khi đăng ký — dùng OTP + email (không cần đăng nhập)
export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    otp: otpSchema,
  }),
});

// Gửi lại OTP xác thực email (không cần đăng nhập)
export const resendEmailOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

// Reset password sau forgot password — dùng OTP thay vì link token
export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    otp: otpSchema,
    newPassword: passwordSchema,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
});

// Xác thực email OTP khi đã đăng nhập
export const verifyEmailOtpSchema = z.object({
  body: z.object({
    otp: otpSchema,
  }),
});

// Đổi mật khẩu bằng OTP khi đã đăng nhập
export const changePasswordWithOtpSchema = z.object({
  body: z.object({
    otp: otpSchema,
    newPassword: passwordSchema,
  }),
});

export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return (
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction
  ) => {
    try {
      schema.parse({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (error) {
      next(error);
    }
  };
};