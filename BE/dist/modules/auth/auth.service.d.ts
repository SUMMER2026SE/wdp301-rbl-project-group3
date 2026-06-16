import { DeviceInfo } from '../../types/common.types';
export declare class AuthService {
    register(data: {
        fullName: string;
        email: string;
        password: string;
        phone?: string;
    }): Promise<{
        message: string;
    }>;
    verifyEmailWithOtp(email: string, otp: string): Promise<{
        message: string;
    }>;
    resendEmailVerificationOtp(email: string): Promise<{
        message: string;
    }>;
    requestEmailVerificationOtp(userId: string): Promise<{
        message: string;
    }>;
    verifyEmailOtp(userId: string, otp: string): Promise<{
        message: string;
    }>;
    login(data: {
        email: string;
        password: string;
    }, deviceInfo: DeviceInfo): Promise<{
        accessToken: string;
        refreshToken: string;
        user: object;
    }>;
    googleLogin(idToken: string, deviceInfo: DeviceInfo): Promise<{
        accessToken: string;
        refreshToken: string;
        user: object;
    }>;
    refreshToken(refreshToken: string, deviceInfo: DeviceInfo): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    logoutAll(userId: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(otp: string, newPassword: string): Promise<{
        message: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    requestPasswordChangeOtp(userId: string): Promise<{
        message: string;
    }>;
    changePasswordWithOtp(userId: string, otp: string, newPassword: string): Promise<{
        message: string;
    }>;
    uploadAvatar(userId: string, fileBuffer: Buffer, mimetype: string): Promise<string>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map