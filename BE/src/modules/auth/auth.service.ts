import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';

import { authRepository } from './auth.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
} from '../../utils/hash.util';
import { generateTokenPair, verifyRefreshToken } from '../../utils/token.util';
import { sendVerificationEmail, sendPasswordResetEmail, sendOtpEmail } from '../../utils/mail.util';
import { cloudinary } from '../../config/cloudinary.config';
import { env } from '../../config/env.config';
import { DeviceInfo } from '../../types/common.types';

const googleClient = new OAuth2Client(env.google.clientId);

export class AuthService {
  // ─── Register ────────────────────────────────────────────
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ message: string }> {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) throw new AppError('Email already registered', 409);

    const passwordHash = await hashPassword(data.password);
    const user = await authRepository.createUser({
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      phone: data.phone,
      authProvider: 'local',
      status: 'inactive',
      isEmailVerified: false,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = hashToken(otp);
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await authRepository.setEmailVerifyToken(user._id.toString(), tokenHash, expires);
    await sendOtpEmail(data.email, otp);

    return { message: 'Registration successful. An OTP has been sent to your email.' };
  }

  // ─── Verify Email ────────────────────────────────────────
  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = hashToken(token);
    const user = await authRepository.findUserByEmailVerifyToken(tokenHash);
    if (!user) throw new AppError('Invalid or expired verification token', 400);

    await authRepository.markEmailVerified(user._id.toString());
    return { message: 'Email verified successfully.' };
  }

  // ─── OTP Email Verification ──────────────────────────────
  async requestEmailVerificationOtp(userId: string): Promise<{ message: string }> {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.isEmailVerified) throw new AppError('Email is already verified', 400);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = hashToken(otp);
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await authRepository.setEmailVerifyToken(user._id.toString(), tokenHash, expires);
    await sendOtpEmail(user.email, otp);

    return { message: 'OTP sent to your email.' };
  }

  async verifyEmailOtp(userId: string, otp: string): Promise<{ message: string }> {
    const tokenHash = hashToken(otp);
    const user = await authRepository.findUserByEmailVerifyToken(tokenHash);
    if (!user || user._id.toString() !== userId) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    await authRepository.markEmailVerified(user._id.toString());
    return { message: 'Email verified successfully.' };
  }

  // ─── Login ───────────────────────────────────────────────
  async login(
    data: { email: string; password: string },
    deviceInfo: DeviceInfo
  ): Promise<{ accessToken: string; refreshToken: string; user: object }> {
    const user = await authRepository.findUserByEmail(data.email, true);
    if (!user || !user.passwordHash) throw new AppError('Invalid credentials', 401);

    if (user.authProvider !== 'local') {
      throw new AppError('Please login with Google', 400);
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    if (user.status === 'banned') throw new AppError('Account has been banned', 403);

    const tokenId = uuidv4();
    const { accessToken, refreshToken } = generateTokenPair(user, tokenId);
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + env.jwt.refreshExpiresInMs);

    await authRepository.createUserToken({
      userId: user._id,
      refreshTokenHash,
      expiresAt,
      deviceInfo,
    });

    await authRepository.updateLastLogin(user._id.toString());

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ─── Google Login ─────────────────────────────────────────
  async googleLogin(
    idToken: string,
    deviceInfo: DeviceInfo
  ): Promise<{ accessToken: string; refreshToken: string; user: object }> {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new AppError('Invalid Google token', 400);

    let user = await authRepository.findUserByGoogleId(payload.sub!);

    if (!user) {
      user = await authRepository.findUserByEmail(payload.email);
    }

    if (user) {
      if (user.authProvider === 'local') {
        throw new AppError('Email already registered with password. Please login normally.', 409);
      }
      await authRepository.updateUser(user._id.toString(), {
        googleId: payload.sub,
        avatarUrl: user.avatarUrl || payload.picture,
        lastLoginAt: new Date(),
      });
    } else {
      user = await authRepository.createUser({
        fullName: payload.name || payload.email,
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture,
        authProvider: 'google',
        isEmailVerified: true,
        status: 'active',
      });
    }

    const tokenId = uuidv4();
    const { accessToken, refreshToken } = generateTokenPair(user, tokenId);
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + env.jwt.refreshExpiresInMs);

    await authRepository.createUserToken({
      userId: user._id,
      refreshTokenHash,
      expiresAt,
      deviceInfo,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ─── Refresh Token ────────────────────────────────────────
  async refreshToken(
    refreshToken: string,
    deviceInfo: DeviceInfo
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { userId: string; tokenId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const storedToken = await authRepository.findUserTokenById(payload.tokenId);
    if (!storedToken) throw new AppError('Refresh token revoked or expired', 401);

    const tokenHash = hashToken(refreshToken);
    if (storedToken.refreshTokenHash !== tokenHash) {
      await authRepository.revokeUserToken(payload.tokenId);
      throw new AppError('Refresh token reuse detected. Please login again.', 401);
    }

    const user = await authRepository.findUserById(payload.userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.status !== 'active') throw new AppError('Account is not active', 403);

    const newTokenId = uuidv4();
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user, newTokenId);
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + env.jwt.refreshExpiresInMs);

    await authRepository.revokeUserToken(payload.tokenId);
    await authRepository.createUserToken({
      userId: user._id,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt,
      deviceInfo,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  // ─── Logout ───────────────────────────────────────────────
  async logout(refreshToken: string): Promise<{ message: string }> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await authRepository.revokeUserToken(payload.tokenId);
    } catch {
      // silently fail - token may already be invalid
    }
    return { message: 'Logged out successfully' };
  }

  // ─── Logout All ───────────────────────────────────────────
  async logoutAll(userId: string): Promise<{ message: string }> {
    await authRepository.revokeAllUserTokens(userId);
    await authRepository.incrementRefreshTokenVersion(userId);
    return { message: 'Logged out from all devices' };
  }

  // ─── Forgot Password ──────────────────────────────────────
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await authRepository.findUserByEmail(email);

    if (!user || user.authProvider !== 'local') {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await authRepository.createPasswordReset({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    await sendPasswordResetEmail(email, rawToken);
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  // ─── Reset Password ───────────────────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = hashToken(token);
    const resetRecord = await authRepository.findPasswordResetByTokenHash(tokenHash);
    if (!resetRecord) throw new AppError('Invalid or expired reset token', 400);

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updateUser(resetRecord.userId.toString(), {
      passwordHash,
      passwordChangedAt: new Date(),
    });

    await authRepository.markPasswordResetUsed(resetRecord._id.toString());
    await authRepository.revokeAllUserTokens(resetRecord.userId.toString());
    await authRepository.incrementRefreshTokenVersion(resetRecord.userId.toString());

    return { message: 'Password reset successfully. Please login again.' };
  }

  // ─── Change Password ──────────────────────────────────────
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await authRepository.findUserById(userId, true);
    if (!user) throw new AppError('User not found', 404);

    if (user.authProvider !== 'local' || !user.passwordHash) {
      throw new AppError('Cannot change password for social accounts', 400);
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    const isSame = await comparePassword(newPassword, user.passwordHash);
    if (isSame) throw new AppError('New password must be different from current password', 400);

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updateUser(userId, {
      passwordHash,
      passwordChangedAt: new Date(),
    });

    await authRepository.revokeAllUserTokens(userId);
    await authRepository.incrementRefreshTokenVersion(userId);

    return { message: 'Password changed successfully. Please login again.' };
  }

  // ─── Change Password With OTP ─────────────────────────────
  async changePasswordWithOtp(
    userId: string,
    otp: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const tokenHash = hashToken(otp);
    const userOTP = await authRepository.findUserByEmailVerifyToken(tokenHash);
    if (!userOTP || userOTP._id.toString() !== userId) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const user = await authRepository.findUserById(userId, true);
    if (!user || user.authProvider !== 'local' || !user.passwordHash) {
      throw new AppError('Cannot change password for social accounts', 400);
    }

    const isSame = await comparePassword(newPassword, user.passwordHash);
    if (isSame) throw new AppError('New password must be different from current password', 400);

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updateUser(userId, {
      passwordHash,
      passwordChangedAt: new Date(),
      emailVerifyToken: undefined,
      emailVerifyTokenExpires: undefined,
    });

    await authRepository.revokeAllUserTokens(userId);
    await authRepository.incrementRefreshTokenVersion(userId);

    return { message: 'Password changed successfully. Please login again.' };
  }

  // ─── Upload Avatar ────────────────────────────────────────
  async uploadAvatar(userId: string, fileBuffer: Buffer, mimetype: string): Promise<string> {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'minimart/avatars',
          public_id: `user_${userId}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve(result as { secure_url: string });
        }
      );
      uploadStream.end(fileBuffer);
    });

    await authRepository.updateUser(userId, { avatarUrl: result.secure_url });
    return result.secure_url;
  }
}

export const authService = new AuthService();