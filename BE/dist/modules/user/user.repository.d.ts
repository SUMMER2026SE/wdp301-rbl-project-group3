import { IUser } from '../../models/user.model';
export declare class UserRepository {
    findById(id: string): Promise<IUser | null>;
    updateById(id: string, data: Partial<IUser>): Promise<IUser | null>;
}
export declare const userRepository: UserRepository;
//# sourceMappingURL=user.repository.d.ts.map