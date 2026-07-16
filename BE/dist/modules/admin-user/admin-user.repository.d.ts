import { Types } from 'mongoose';
import { IUser } from '../../models/user.model';
import { UserRole, UserStatus } from '../../types/common.types';
export interface AdminUserListFilters {
    keyword?: string;
    role?: string;
    status?: string;
}
export interface PaginatedUsers {
    items: IUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class AdminUserRepository {
    findPaginated(filters: AdminUserListFilters, page: number, limit: number): Promise<PaginatedUsers>;
    findById(id: string): Promise<IUser | null>;
    updateStatusById(id: string, status: UserStatus, incrementTokenVersion?: boolean): Promise<IUser | null>;
    updateRoleById(id: string, role: UserRole, branchId?: Types.ObjectId | null): Promise<IUser | null>;
}
export declare const adminUserRepository: AdminUserRepository;
//# sourceMappingURL=admin-user.repository.d.ts.map