"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const uuid_1 = require("uuid");
const google_auth_library_1 = require("google-auth-library");
const auth_repository_1 = require("./auth.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const hash_util_1 = require("../../utils/hash.util");
const token_util_1 = require("../../utils/token.util");
const mail_util_1 = require("../../utils/mail.util");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const env_config_1 = require("../../config/env.config");
const googleClient = new google_auth_library_1.OAuth2Client(env_config_1.env.google.clientId);
class AuthService {
    // ─── Register ────────────────────────────────────────────
    async register(data) {
        const existing = await auth_repository_1.authRepository.findUserByEmail(data.email);
        if (existing)
            throw new errorHandler_middleware_1.AppError('Email already registered', 409);
        const passwordHash = await (0, hash_util_1.hashPassword)(data.password);
        const user = await auth_repository_1.authRepository.createUser({
            fullName: data.fullName,
            email: data.email,
            passwordHash,
            phone: data.phone,
            authProvider: 'local',
            status: 'inactive',
            isEmailVerified: false,
        });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenHash = (0, hash_util_1.hashToken)(otp);
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        await auth_repository_1.authRepository.setEmailVerifyToken(user._id.toString(), tokenHash, expires);
        await (0, mail_util_1.sendOtpEmail)(data.email, otp);
        return { message: 'Registration successful. An OTP has been sent to your email.' };
    }
    // ─── Verify Email ────────────────────────────────────────
    async verifyEmail(token) {
        const tokenHash = (0, hash_util_1.hashToken)(token);
        const user = await auth_repository_1.authRepository.findUserByEmailVerifyToken(tokenHash);
        if (!user)
            throw new errorHandler_middleware_1.AppError('Invalid or expired verification token', 400);
        await auth_repository_1.authRepository.markEmailVerified(user._id.toString());
        return { message: 'Email verified successfully.' };
    }
    // ─── OTP Email Verification ──────────────────────────────
    async requestEmailVerificationOtp(userId) {
        const user = await auth_repository_1.authRepository.findUserById(userId);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        if (user.isEmailVerified)
            throw new errorHandler_middleware_1.AppError('Email is already verified', 400);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenHash = (0, hash_util_1.hashToken)(otp);
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        await auth_repository_1.authRepository.setEmailVerifyToken(user._id.toString(), tokenHash, expires);
        await (0, mail_util_1.sendOtpEmail)(user.email, otp);
        return { message: 'OTP sent to your email.' };
    }
    // ─── OTP Password Change ─────────────────────────────────
    async requestPasswordChangeOtp(userId) {
        const user = await auth_repository_1.authRepository.findUserById(userId);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        if (user.authProvider !== 'local')
            throw new errorHandler_middleware_1.AppError('Cannot change password for social accounts', 400);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenHash = (0, hash_util_1.hashToken)(otp);
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        await auth_repository_1.authRepository.setEmailVerifyToken(user._id.toString(), tokenHash, expires);
        await (0, mail_util_1.sendOtpEmail)(user.email, otp);
        return { message: 'OTP sent to your email.' };
    }
    async verifyEmailOtp(userId, otp) {
        const tokenHash = (0, hash_util_1.hashToken)(otp);
        const user = await auth_repository_1.authRepository.findUserByEmailVerifyToken(tokenHash);
        if (!user || user._id.toString() !== userId) {
            throw new errorHandler_middleware_1.AppError('Invalid or expired OTP', 400);
        }
        await auth_repository_1.authRepository.markEmailVerified(user._id.toString());
        return { message: 'Email verified successfully.' };
    }
    // ─── Login ───────────────────────────────────────────────
    async login(data, deviceInfo) {
        const user = await auth_repository_1.authRepository.findUserByEmail(data.email, true);
        if (!user || !user.passwordHash)
            throw new errorHandler_middleware_1.AppError('Invalid credentials', 401);
        if (user.authProvider !== 'local') {
            throw new errorHandler_middleware_1.AppError('Please login with Google', 400);
        }
        const isMatch = await (0, hash_util_1.comparePassword)(data.password, user.passwordHash);
        if (!isMatch)
            throw new errorHandler_middleware_1.AppError('Invalid credentials', 401);
        if (user.status === 'banned')
            throw new errorHandler_middleware_1.AppError('Account has been banned', 403);
        const tokenId = (0, uuid_1.v4)();
        const { accessToken, refreshToken } = (0, token_util_1.generateTokenPair)(user, tokenId);
        const refreshTokenHash = (0, hash_util_1.hashToken)(refreshToken);
        const expiresAt = new Date(Date.now() + env_config_1.env.jwt.refreshExpiresInMs);
        await auth_repository_1.authRepository.createUserToken({
            userId: user._id,
            refreshTokenHash,
            expiresAt,
            deviceInfo,
        });
        await auth_repository_1.authRepository.updateLastLogin(user._id.toString());
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
    async googleLogin(idToken, deviceInfo) {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: env_config_1.env.google.clientId,
        });
        const payload = ticket.getPayload();
        if (!payload?.email)
            throw new errorHandler_middleware_1.AppError('Invalid Google token', 400);
        let user = await auth_repository_1.authRepository.findUserByGoogleId(payload.sub);
        if (!user) {
            user = await auth_repository_1.authRepository.findUserByEmail(payload.email);
        }
        if (user) {
            if (user.authProvider === 'local') {
                throw new errorHandler_middleware_1.AppError('Email already registered with password. Please login normally.', 409);
            }
            await auth_repository_1.authRepository.updateUser(user._id.toString(), {
                googleId: payload.sub,
                avatarUrl: user.avatarUrl || payload.picture,
                lastLoginAt: new Date(),
            });
        }
        else {
            user = await auth_repository_1.authRepository.createUser({
                fullName: payload.name || payload.email,
                email: payload.email,
                googleId: payload.sub,
                avatarUrl: payload.picture,
                authProvider: 'google',
                isEmailVerified: true,
                status: 'active',
            });
        }
        const tokenId = (0, uuid_1.v4)();
        const { accessToken, refreshToken } = (0, token_util_1.generateTokenPair)(user, tokenId);
        const refreshTokenHash = (0, hash_util_1.hashToken)(refreshToken);
        const expiresAt = new Date(Date.now() + env_config_1.env.jwt.refreshExpiresInMs);
        await auth_repository_1.authRepository.createUserToken({
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
    async refreshToken(refreshToken, deviceInfo) {
        let payload;
        try {
            payload = (0, token_util_1.verifyRefreshToken)(refreshToken);
        }
        catch {
            throw new errorHandler_middleware_1.AppError('Invalid refresh token', 401);
        }
        const storedToken = await auth_repository_1.authRepository.findUserTokenById(payload.tokenId);
        if (!storedToken)
            throw new errorHandler_middleware_1.AppError('Refresh token revoked or expired', 401);
        const tokenHash = (0, hash_util_1.hashToken)(refreshToken);
        if (storedToken.refreshTokenHash !== tokenHash) {
            await auth_repository_1.authRepository.revokeUserToken(payload.tokenId);
            throw new errorHandler_middleware_1.AppError('Refresh token reuse detected. Please login again.', 401);
        }
        const user = await auth_repository_1.authRepository.findUserById(payload.userId);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        if (user.status !== 'active')
            throw new errorHandler_middleware_1.AppError('Account is not active', 403);
        const newTokenId = (0, uuid_1.v4)();
        const { accessToken, refreshToken: newRefreshToken } = (0, token_util_1.generateTokenPair)(user, newTokenId);
        const newRefreshTokenHash = (0, hash_util_1.hashToken)(newRefreshToken);
        const expiresAt = new Date(Date.now() + env_config_1.env.jwt.refreshExpiresInMs);
        await auth_repository_1.authRepository.revokeUserToken(payload.tokenId);
        await auth_repository_1.authRepository.createUserToken({
            userId: user._id,
            refreshTokenHash: newRefreshTokenHash,
            expiresAt,
            deviceInfo,
        });
        return { accessToken, refreshToken: newRefreshToken };
    }
    // ─── Logout ───────────────────────────────────────────────
    async logout(refreshToken) {
        try {
            const payload = (0, token_util_1.verifyRefreshToken)(refreshToken);
            await auth_repository_1.authRepository.revokeUserToken(payload.tokenId);
        }
        catch {
            // silently fail - token may already be invalid
        }
        return { message: 'Logged out successfully' };
    }
    // ─── Logout All ───────────────────────────────────────────
    async logoutAll(userId) {
        await auth_repository_1.authRepository.revokeAllUserTokens(userId);
        await auth_repository_1.authRepository.incrementRefreshTokenVersion(userId);
        return { message: 'Logged out from all devices' };
    }
    // ─── Forgot Password ──────────────────────────────────────
    async forgotPassword(email) {
        const user = await auth_repository_1.authRepository.findUserByEmail(email);
        if (!user || user.authProvider !== 'local') {
            return { message: 'If the email exists, an OTP has been sent.' };
        }
        const rawToken = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenHash = (0, hash_util_1.hashToken)(rawToken);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins for OTP
        await auth_repository_1.authRepository.createPasswordReset({
            userId: user._id,
            tokenHash,
            expiresAt,
        });
        await (0, mail_util_1.sendOtpEmail)(email, rawToken);
        return { message: 'If the email exists, an OTP has been sent.' };
    }
    // ─── Reset Password ───────────────────────────────────────
    async resetPassword(token, newPassword) {
        const tokenHash = (0, hash_util_1.hashToken)(token);
        const resetRecord = await auth_repository_1.authRepository.findPasswordResetByTokenHash(tokenHash);
        if (!resetRecord)
            throw new errorHandler_middleware_1.AppError('Invalid or expired reset token', 400);
        const passwordHash = await (0, hash_util_1.hashPassword)(newPassword);
        await auth_repository_1.authRepository.updateUser(resetRecord.userId.toString(), {
            passwordHash,
            passwordChangedAt: new Date(),
        });
        await auth_repository_1.authRepository.markPasswordResetUsed(resetRecord._id.toString());
        await auth_repository_1.authRepository.revokeAllUserTokens(resetRecord.userId.toString());
        await auth_repository_1.authRepository.incrementRefreshTokenVersion(resetRecord.userId.toString());
        return { message: 'Password reset successfully. Please login again.' };
    }
    // ─── Change Password ──────────────────────────────────────
    async changePassword(userId, currentPassword, newPassword) {
        const user = await auth_repository_1.authRepository.findUserById(userId, true);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        if (user.authProvider !== 'local' || !user.passwordHash) {
            throw new errorHandler_middleware_1.AppError('Cannot change password for social accounts', 400);
        }
        const isMatch = await (0, hash_util_1.comparePassword)(currentPassword, user.passwordHash);
        if (!isMatch)
            throw new errorHandler_middleware_1.AppError('Current password is incorrect', 400);
        const isSame = await (0, hash_util_1.comparePassword)(newPassword, user.passwordHash);
        if (isSame)
            throw new errorHandler_middleware_1.AppError('New password must be different from current password', 400);
        const passwordHash = await (0, hash_util_1.hashPassword)(newPassword);
        await auth_repository_1.authRepository.updateUser(userId, {
            passwordHash,
            passwordChangedAt: new Date(),
        });
        await auth_repository_1.authRepository.revokeAllUserTokens(userId);
        await auth_repository_1.authRepository.incrementRefreshTokenVersion(userId);
        return { message: 'Password changed successfully. Please login again.' };
    }
    // ─── Change Password With OTP ─────────────────────────────
    async changePasswordWithOtp(userId, otp, newPassword) {
        const tokenHash = (0, hash_util_1.hashToken)(otp);
        const userOTP = await auth_repository_1.authRepository.findUserByEmailVerifyToken(tokenHash);
        if (!userOTP || userOTP._id.toString() !== userId) {
            throw new errorHandler_middleware_1.AppError('Invalid or expired OTP', 400);
        }
        const user = await auth_repository_1.authRepository.findUserById(userId, true);
        if (!user || user.authProvider !== 'local' || !user.passwordHash) {
            throw new errorHandler_middleware_1.AppError('Cannot change password for social accounts', 400);
        }
        const isSame = await (0, hash_util_1.comparePassword)(newPassword, user.passwordHash);
        if (isSame)
            throw new errorHandler_middleware_1.AppError('New password must be different from current password', 400);
        const passwordHash = await (0, hash_util_1.hashPassword)(newPassword);
        await auth_repository_1.authRepository.updateUser(userId, {
            passwordHash,
            passwordChangedAt: new Date(),
            emailVerifyToken: undefined,
            emailVerifyTokenExpires: undefined,
        });
        await auth_repository_1.authRepository.revokeAllUserTokens(userId);
        await auth_repository_1.authRepository.incrementRefreshTokenVersion(userId);
        return { message: 'Password changed successfully. Please login again.' };
    }
    // ─── Upload Avatar ────────────────────────────────────────
    async uploadAvatar(userId, fileBuffer, mimetype) {
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary_config_1.cloudinary.uploader.upload_stream({
                folder: 'minimart/avatars',
                public_id: `user_${userId}`,
                overwrite: true,
                resource_type: 'image',
                transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
            }, (error, result) => {
                if (error || !result)
                    return reject(error || new Error('Upload failed'));
                resolve(result);
            });
            uploadStream.end(fileBuffer);
        });
        await auth_repository_1.authRepository.updateUser(userId, { avatarUrl: result.secure_url });
        return result.secure_url;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map