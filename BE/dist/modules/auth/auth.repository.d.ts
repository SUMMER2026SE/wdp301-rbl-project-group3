import { Types } from 'mongoose';
import { IUser } from '../../models/user.model';
import { IUserToken } from '../../models/userToken.model';
import { IPasswordReset, PasswordResetType } from '../../models/passwordReset.model';
import { DeviceInfo } from '../../types/common.types';
export declare class AuthRepository {
    findUserByEmail(email: string, includePassword?: boolean): Promise<IUser | null>;
    findUserById(id: string, includePassword?: boolean): Promise<IUser | null>;
    findUserByGoogleId(googleId: string): Promise<IUser | null>;
    createUser(data: Partial<IUser>): Promise<IUser>;
    updateUser(id: string, data: Partial<IUser>): Promise<IUser | null>;
    setEmailVerifyOtp(userId: string, otpHash: string, expires: Date): Promise<void>;
    findUserByEmailVerifyOtp(otpHash: string): Promise<IUser | null>;
    markEmailVerified(userId: string): Promise<void>;
    clearEmailVerifyOtp(userId: string): Promise<void>;
    incrementRefreshTokenVersion(userId: string): Promise<void>;
    updateLastLogin(userId: string): Promise<void>;
    createUserToken(data: {
        userId: Types.ObjectId;
        refreshTokenHash: string;
        expiresAt: Date;
        deviceInfo: DeviceInfo;
    }): Promise<IUserToken>;
    findUserTokenById(tokenId: string): Promise<IUserToken | null>;
    revokeUserToken(tokenId: string): Promise<void>;
    revokeAllUserTokens(userId: string): Promise<void>;
    updateUserToken(tokenId: string, refreshTokenHash: string, expiresAt: Date): Promise<void>;
    createPasswordResetOtp(data: {
        userId: Types.ObjectId;
        tokenHash: string;
        type: PasswordResetType;
        expiresAt: Date;
    }): Promise<IPasswordReset>;
    findPasswordResetOtp(tokenHash: string, type: PasswordResetType): Promise<IPasswordReset | null>;
    markPasswordResetUsed(resetId: string): Promise<void>;
}
export declare const authRepository: AuthRepository;
//# sourceMappingURL=auth.repository.d.ts.map