"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const deviceInfo_util_1 = require("../../utils/deviceInfo.util");
const env_config_1 = require("../../config/env.config");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const REFRESH_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env_config_1.env.isProduction,
    sameSite: 'strict',
    maxAge: env_config_1.env.jwt.refreshExpiresInMs,
    path: '/api/auth',
};
const clearRefreshCookie = (res) => {
    res.clearCookie('refreshToken', { path: '/api/auth' });
};
class AuthController {
    constructor() {
        this.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const result = await auth_service_1.authService.register(req.body);
            (0, response_util_1.sendSuccess)(res, null, result.message, 201);
        });
        // Xác thực email sau đăng ký — nhận email + otp (không cần đăng nhập)
        this.verifyEmail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { email, otp } = req.body;
            const result = await auth_service_1.authService.verifyEmailWithOtp(email, otp);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
        // Gửi lại OTP xác thực email (không cần đăng nhập)
        this.resendEmailOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { email } = req.body;
            const result = await auth_service_1.authService.resendEmailVerificationOtp(email);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
        this.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const deviceInfo = (0, deviceInfo_util_1.extractDeviceInfo)(req);
            const { accessToken, refreshToken, user } = await auth_service_1.authService.login(req.body, deviceInfo);
            res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
            (0, response_util_1.sendSuccess)(res, { accessToken, user }, 'Login successful');
        });
        this.googleLogin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const deviceInfo = (0, deviceInfo_util_1.extractDeviceInfo)(req);
            const { idToken } = req.body;
            const { accessToken, refreshToken, user } = await auth_service_1.authService.googleLogin(idToken, deviceInfo);
            res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
            (0, response_util_1.sendSuccess)(res, { accessToken, user }, 'Google login successful');
        });
        this.refreshToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const refreshToken = req.cookies?.refreshToken ||
                req.headers['x-refresh-token'] ||
                req.body?.refreshToken;
            if (!refreshToken)
                throw new errorHandler_middleware_1.AppError('Refresh token required', 401);
            const deviceInfo = (0, deviceInfo_util_1.extractDeviceInfo)(req);
            const { accessToken, refreshToken: newRefreshToken } = await auth_service_1.authService.refreshToken(refreshToken, deviceInfo);
            res.cookie('refreshToken', newRefreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
            (0, response_util_1.sendSuccess)(res, { accessToken }, 'Token refreshed');
        });
        this.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const refreshToken = req.cookies?.refreshToken ||
                req.headers['x-refresh-token'] ||
                req.body?.refreshToken;
            if (refreshToken) {
                await auth_service_1.authService.logout(refreshToken);
            }
            clearRefreshCookie(res);
            (0, response_util_1.sendSuccess)(res, null, 'Logged out successfully');
        });
        this.logoutAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const result = await auth_service_1.authService.logoutAll(userId);
            clearRefreshCookie(res);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
        this.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { email } = req.body;
            const result = await auth_service_1.authService.forgotPassword(email);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
        // Reset password — nhận email + otp + newPassword
        this.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { email, otp, newPassword } = req.body;
            const result = await auth_service_1.authService.resetPassword(otp, newPassword);
            clearRefreshCookie(res);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
        this.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { currentPassword, newPassword } = req.body;
            const result = await auth_service_1.authService.changePassword(userId, currentPassword, newPassword);
            clearRefreshCookie(res);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
        // Yêu cầu OTP xác thực email (khi đã đăng nhập)
        this.requestEmailVerificationOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const result = await auth_service_1.authService.requestEmailVerificationOtp(userId);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
        // Xác thực email bằng OTP (khi đã đăng nhập)
        this.verifyEmailOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { otp } = req.body;
            const result = await auth_service_1.authService.verifyEmailOtp(userId, otp);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
        // Yêu cầu OTP để đổi mật khẩu (khi đã đăng nhập)
        this.requestPasswordChangeOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const result = await auth_service_1.authService.requestPasswordChangeOtp(userId);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
        // Đổi mật khẩu bằng OTP (khi đã đăng nhập)
        this.changePasswordWithOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { otp, newPassword } = req.body;
            const result = await auth_service_1.authService.changePasswordWithOtp(userId, otp, newPassword);
            clearRefreshCookie(res);
            (0, response_util_1.sendSuccess)(res, null, result.message);
        });
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map