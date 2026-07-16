import { IUser } from '../../models/user.model';
export type ProfileUpdateData = {
    fullName?: string;
    phone?: string;
    address?: string;
};
export type AvatarUpdateData = {
    avatarUrl: string;
};
export declare class UserRepository {
    findById(id: string): Promise<IUser | null>;
    updateProfileById(id: string, data: ProfileUpdateData): Promise<IUser | null>;
    updateAvatarById(id: string, avatarUrl: string): Promise<IUser | null>;
}
export declare const userRepository: UserRepository;
//# sourceMappingURL=user.repository.d.ts.map