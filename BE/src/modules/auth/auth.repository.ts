import { Types } from 'mongoose';
import { User, IUser } from '../../models/user.model';
import { UserToken, IUserToken } from '../../models/userToken.model';
import { PasswordReset, IPasswordReset } from '../../models/passwordReset.model';
import { DeviceInfo } from '../../types/common.types';

export class AuthRepository {
  // ─── User ───────────────────────────────────────────────
  async findUserByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select('+passwordHash');
    return query.exec();
  }

  async findUserById(id: string, includePassword = false): Promise<IUser | null> {
    const query = User.findById(id);
    if (includePassword) query.select('+passwordHash');
    return query.exec();
  }

  async findUserByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId }).exec();
  }

  async createUser(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async setEmailVerifyToken(userId: string, tokenHash: string, expires: Date): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      emailVerifyToken: tokenHash,
      emailVerifyTokenExpires: expires,
    }).exec();
  }

  async findUserByEmailVerifyToken(tokenHash: string): Promise<IUser | null> {
    return User.findOne({
      emailVerifyToken: tokenHash,
      emailVerifyTokenExpires: { $gt: new Date() },
    })
      .select('+emailVerifyToken +emailVerifyTokenExpires')
      .exec();
  }

  async markEmailVerified(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      isEmailVerified: true,
      status: 'active',
      emailVerifyToken: undefined,
      emailVerifyTokenExpires: undefined,
    }).exec();
  }

  async incrementRefreshTokenVersion(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } }).exec();
  }

  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() }).exec();
  }

  // ─── UserToken ───────────────────────────────────────────
  async createUserToken(data: {
    userId: Types.ObjectId;
    refreshTokenHash: string;
    expiresAt: Date;
    deviceInfo: DeviceInfo;
  }): Promise<IUserToken> {
    const token = new UserToken({
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

  async findUserTokenById(tokenId: string): Promise<IUserToken | null> {
    return UserToken.findOne({
      _id: tokenId,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).exec();
  }

  async revokeUserToken(tokenId: string): Promise<void> {
    await UserToken.findByIdAndUpdate(tokenId, { revokedAt: new Date() }).exec();
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await UserToken.updateMany(
      { userId, revokedAt: { $exists: false } },
      { revokedAt: new Date() }
    ).exec();
  }

  async updateUserToken(
    tokenId: string,
    refreshTokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    await UserToken.findByIdAndUpdate(tokenId, { refreshTokenHash, expiresAt }).exec();
  }

  // ─── PasswordReset ───────────────────────────────────────
  async createPasswordReset(data: {
    userId: Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<IPasswordReset> {
    await PasswordReset.deleteMany({ userId: data.userId });
    const reset = new PasswordReset(data);
    return reset.save();
  }

  async findPasswordResetByTokenHash(tokenHash: string): Promise<IPasswordReset | null> {
    return PasswordReset.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
    }).exec();
  }

  async markPasswordResetUsed(resetId: string): Promise<void> {
    await PasswordReset.findByIdAndUpdate(resetId, { usedAt: new Date() }).exec();
  }
}

export const authRepository = new AuthRepository();