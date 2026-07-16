"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepository = exports.AuthRepository = void 0;
const user_model_1 = require("../../models/user.model");
const userToken_model_1 = require("../../models/userToken.model");
const passwordReset_model_1 = require("../../models/passwordReset.model");
class AuthRepository {
    // ─── User ───────────────────────────────────────────────
    async findUserByEmail(email, includePassword = false) {
        const query = user_model_1.User.findOne({ email: email.toLowerCase() });
        if (includePassword)
            query.select('+passwordHash');
        return query.exec();
    }
    async findUserById(id, includePassword = false) {
        const query = user_model_1.User.findById(id);
        if (includePassword)
            query.select('+passwordHash');
        return query.exec();
    }
    async findUserByGoogleId(googleId) {
        return user_model_1.User.findOne({ googleId }).exec();
    }
    async createUser(data) {
        const user = new user_model_1.User(data);
        return user.save();
    }
    async updateUser(id, data) {
        return user_model_1.User.findByIdAndUpdate(id, data, { new: true }).exec();
    }
    async setEmailVerifyOtp(userId, otpHash, expires) {
        await user_model_1.User.findByIdAndUpdate(userId, {
            emailVerifyToken: otpHash,
            emailVerifyTokenExpires: expires,
        }).exec();
    }
    async findUserByEmailVerifyOtp(otpHash) {
        return user_model_1.User.findOne({
            emailVerifyToken: otpHash,
            emailVerifyTokenExpires: { $gt: new Date() },
        })
            .select('+emailVerifyToken +emailVerifyTokenExpires')
            .exec();
    }
    async markEmailVerified(userId) {
        await user_model_1.User.findByIdAndUpdate(userId, {
            isEmailVerified: true,
            status: 'active',
            emailVerifyToken: undefined,
            emailVerifyTokenExpires: undefined,
        }).exec();
    }
    async clearEmailVerifyOtp(userId) {
        await user_model_1.User.findByIdAndUpdate(userId, {
            emailVerifyToken: undefined,
            emailVerifyTokenExpires: undefined,
        }).exec();
    }
    async incrementRefreshTokenVersion(userId) {
        await user_model_1.User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } }).exec();
    }
    async updateLastLogin(userId) {
        await user_model_1.User.findByIdAndUpdate(userId, { lastLoginAt: new Date() }).exec();
    }
    // ─── UserToken ───────────────────────────────────────────
    async createUserToken(data) {
        const token = new userToken_model_1.UserToken({
            userId: data.userId,
            refreshTokenHash: data.refreshTokenHash,
            expiresAt: data.expiresAt,
            deviceType: data.deviceInfo.deviceType,
            deviceName: data.deviceInfo.deviceName,
            ipAddress: data.deviceInfo.ipAddress,
            userAgent: data.deviceInfo.userAgent,
        });
        return token.save();
    }
    async findUserTokenById(tokenId) {
        return userToken_model_1.UserToken.findOne({
            _id: tokenId,
            revokedAt: { $exists: false },
            expiresAt: { $gt: new Date() },
        }).exec();
    }
    async revokeUserToken(tokenId) {
        await userToken_model_1.UserToken.findByIdAndUpdate(tokenId, { revokedAt: new Date() }).exec();
    }
    async revokeAllUserTokens(userId) {
        await userToken_model_1.UserToken.updateMany({ userId, revokedAt: { $exists: false } }, { revokedAt: new Date() }).exec();
    }
    async updateUserToken(tokenId, refreshTokenHash, expiresAt) {
        await userToken_model_1.UserToken.findByIdAndUpdate(tokenId, { refreshTokenHash, expiresAt }).exec();
    }
    // ─── PasswordReset (OTP) ─────────────────────────────────
    async createPasswordResetOtp(data) {
        // Xoá OTP cũ cùng type trước khi tạo mới
        await passwordReset_model_1.PasswordReset.deleteMany({ userId: data.userId, type: data.type });
        const reset = new passwordReset_model_1.PasswordReset(data);
        return reset.save();
    }
    async findPasswordResetOtp(tokenHash, type) {
        return passwordReset_model_1.PasswordReset.findOne({
            tokenHash,
            type,
            expiresAt: { $gt: new Date() },
            usedAt: { $exists: false },
        }).exec();
    }
    async markPasswordResetUsed(resetId) {
        await passwordReset_model_1.PasswordReset.findByIdAndUpdate(resetId, { usedAt: new Date() }).exec();
    }
}
exports.AuthRepository = AuthRepository;
exports.authRepository = new AuthRepository();
//# sourceMappingURL=auth.repository.js.map