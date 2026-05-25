import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate, registerSchema, loginSchema, verifyEmailSchema, googleLoginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, verifyEmailOtpSchema, changePasswordWithOtpSchema } from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google-login', validate(googleLoginSchema), authController.googleLogin);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

router.post('/request-email-otp', authenticate, authController.requestEmailVerificationOtp);
router.post('/verify-email-otp', authenticate, validate(verifyEmailOtpSchema), authController.verifyEmailOtp);
router.post('/change-password-otp', authenticate, validate(changePasswordWithOtpSchema), authController.changePasswordWithOtp);

export default router;