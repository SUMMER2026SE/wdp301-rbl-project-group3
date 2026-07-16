"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
// ─── Public routes ───────────────────────────────────────────────────────────
router.post('/register', (0, auth_validation_1.validate)(auth_validation_1.registerSchema), auth_controller_1.authController.register);
// Xác thực email sau đăng ký (không cần đăng nhập) — nhận email + otp
router.post('/verify-email', (0, auth_validation_1.validate)(auth_validation_1.verifyEmailSchema), auth_controller_1.authController.verifyEmail);
// Gửi lại OTP xác thực email (không cần đăng nhập)
router.post('/resend-email-otp', (0, auth_validation_1.validate)(auth_validation_1.resendEmailOtpSchema), auth_controller_1.authController.resendEmailOtp);
router.post('/login', (0, auth_validation_1.validate)(auth_validation_1.loginSchema), auth_controller_1.authController.login);
router.post('/google-login', (0, auth_validation_1.validate)(auth_validation_1.googleLoginSchema), auth_controller_1.authController.googleLogin);
router.post('/refresh-token', auth_controller_1.authController.refreshToken);
router.post('/logout', auth_controller_1.authController.logout);
// Quên mật khẩu — gửi OTP về email
router.post('/forgot-password', (0, auth_validation_1.validate)(auth_validation_1.forgotPasswordSchema), auth_controller_1.authController.forgotPassword);
// Đặt lại mật khẩu — nhận email + otp + newPassword
router.post('/reset-password', (0, auth_validation_1.validate)(auth_validation_1.resetPasswordSchema), auth_controller_1.authController.resetPassword);
// ─── Protected routes (cần đăng nhập) ───────────────────────────────────────
router.post('/logout-all', auth_middleware_1.authenticate, auth_controller_1.authController.logoutAll);
// Đổi mật khẩu biết mật khẩu cũ
router.post('/change-password', auth_middleware_1.authenticate, (0, auth_validation_1.validate)(auth_validation_1.changePasswordSchema), auth_controller_1.authController.changePassword);
// Xác thực email bằng OTP khi đã đăng nhập
router.post('/request-email-otp', auth_middleware_1.authenticate, auth_controller_1.authController.requestEmailVerificationOtp);
router.post('/verify-email-otp', auth_middleware_1.authenticate, (0, auth_validation_1.validate)(auth_validation_1.verifyEmailOtpSchema), auth_controller_1.authController.verifyEmailOtp);
// Đổi mật khẩu bằng OTP khi đã đăng nhập (không biết mật khẩu cũ)
router.post('/request-password-change-otp', auth_middleware_1.authenticate, auth_controller_1.authController.requestPasswordChangeOtp);
router.post('/change-password-otp', auth_middleware_1.authenticate, (0, auth_validation_1.validate)(auth_validation_1.changePasswordWithOtpSchema), auth_controller_1.authController.changePasswordWithOtp);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map