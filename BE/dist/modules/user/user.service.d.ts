type ProfileResponse = {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    role: string;
    avatarUrl?: string;
    authProvider: string;
    isEmailVerified: boolean;
    status: string;
    points?: number;
    lifetimePoints?: number;
    memberLevel?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    branchId?: string;
};
export declare class UserService {
    getProfile(userId: string): Promise<ProfileResponse>;
    updateProfile(userId: string, data: {
        fullName?: string;
        phone?: string;
        address?: string;
    }): Promise<ProfileResponse>;
    updateAvatar(userId: string, fileBuffer: Buffer, mimetype: string): Promise<string>;
}
export declare const userService: UserService;
export {};
//# sourceMappingURL=user.service.d.ts.map