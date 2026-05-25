import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { extractDeviceInfo } from '../../utils/deviceInfo.util';
import { env } from '../../config/env.config';
import { AppError } from '../../middlewares/errorHandler.middleware';

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict' as const,
  maxAge: env.jwt.refreshExpiresInMs,
  path: '/api/auth',
};

const clearRefreshCookie = (res: Response): void => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
};

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    sendSuccess(res, result, result.message, 201);
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await authService.verifyEmail(token);
    sendSuccess(res, result, result.message);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const deviceInfo = extractDeviceInfo(req);
    const { accessToken, refreshToken, user } = await authService.login(req.body, deviceInfo);

    res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken, user }, 'Login successful');
  });

  googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const deviceInfo = extractDeviceInfo(req);
    const { idToken } = req.body;
    const { accessToken, refreshToken, user } = await authService.googleLogin(idToken, deviceInfo);

    res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken, user }, 'Google login successful');
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.headers['x-refresh-token'] as string ||
      req.body?.refreshToken;

    if (!refreshToken) throw new AppError('Refresh token required', 401);

    const deviceInfo = extractDeviceInfo(req);
    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(
      refreshToken,
      deviceInfo
    );

    res.cookie('refreshToken', newRefreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken }, 'Token refreshed');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.headers['x-refresh-token'] as string ||
      req.body?.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    clearRefreshCookie(res);
    sendSuccess(res, null, 'Logged out successfully');
  });

  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await authService.logoutAll(userId);
    clearRefreshCookie(res);
    sendSuccess(res, result, result.message);
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    sendSuccess(res, null, result.message);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    clearRefreshCookie(res);
    sendSuccess(res, null, result.message);
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(userId, currentPassword, newPassword);
    clearRefreshCookie(res);
    sendSuccess(res, null, result.message);
  });

  requestEmailVerificationOtp = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await authService.requestEmailVerificationOtp(userId);
    sendSuccess(res, null, result.message);
  });

  verifyEmailOtp = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { otp } = req.body;
    const result = await authService.verifyEmailOtp(userId, otp);
    sendSuccess(res, null, result.message);
  });

  changePasswordWithOtp = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { otp, newPassword } = req.body;
    const result = await authService.changePasswordWithOtp(userId, otp, newPassword);
    clearRefreshCookie(res);
    sendSuccess(res, null, result.message);
  });
}

export const authController = new AuthController();