import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
    validate,
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    resendEmailOtpSchema,
    googleLoginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    verifyEmailOtpSchema,
    changePasswordWithOtpSchema,
} from './auth.validation';

const router = Router();

// ─── Public routes ───────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), authController.register);

// Xác thực email sau đăng ký (không cần đăng nhập) — nhận email + otp
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

// Gửi lại OTP xác thực email (không cần đăng nhập)
router.post('/resend-email-otp', validate(resendEmailOtpSchema), authController.resendEmailOtp);

router.post('/login', validate(loginSchema), authController.login);
router.post('/google-login', validate(googleLoginSchema), authController.googleLogin);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Quên mật khẩu — gửi OTP về email
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// Đặt lại mật khẩu — nhận email + otp + newPassword
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// ─── Protected routes (cần đăng nhập) ───────────────────────────────────────
router.post('/logout-all', authenticate, authController.logoutAll);

// Đổi mật khẩu biết mật khẩu cũ
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

// Xác thực email bằng OTP khi đã đăng nhập
router.post('/request-email-otp', authenticate, authController.requestEmailVerificationOtp);
router.post('/verify-email-otp', authenticate, validate(verifyEmailOtpSchema), authController.verifyEmailOtp);

// Đổi mật khẩu bằng OTP khi đã đăng nhập (không biết mật khẩu cũ)
router.post('/request-password-change-otp', authenticate, authController.requestPasswordChangeOtp);
router.post('/change-password-otp', authenticate, validate(changePasswordWithOtpSchema), authController.changePasswordWithOtp);

export default router;