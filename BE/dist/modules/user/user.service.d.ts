import { IUser } from '../../models/user.model';
export declare class UserService {
    getProfile(userId: string): Promise<Partial<IUser>>;
    updateProfile(userId: string, data: {
        fullName?: string;
        phone?: string;
        address?: string;
    }): Promise<Partial<IUser>>;
    updateAvatar(userId: string, fileBuffer: Buffer, mimetype: string): Promise<string>;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map