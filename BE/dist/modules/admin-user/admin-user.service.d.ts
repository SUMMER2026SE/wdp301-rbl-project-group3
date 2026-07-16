import { IUser } from '../../models/user.model';
import { UserRole } from '../../types/common.types';
export interface ListUsersQuery {
    page: number;
    limit: number;
    keyword?: string;
    role?: string;
    status?: string;
}
export interface ListUsersResult {
    users: ReturnType<typeof toAdminUserResponse>[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
declare function toAdminUserResponse(user: IUser): {
    id: string;
    fullName: string;
    email: string;
    phone: string | undefined;
    address: string | undefined;
    role: UserRole;
    branchId: string | undefined;
    avatarUrl: string | undefined;
    authProvider: import("../../types/common.types").AuthProvider;
    isEmailVerified: boolean;
    status: import("../../types/common.types").UserStatus;
    lastLoginAt: Date | undefined;
    createdAt: Date;
    updatedAt: Date;
};
export declare class AdminUserService {
    listUsers(query: ListUsersQuery): Promise<ListUsersResult>;
    lockUser(targetUserId: string, adminUserId: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | undefined;
        address: string | undefined;
        role: UserRole;
        branchId: string | undefined;
        avatarUrl: string | undefined;
        authProvider: import("../../types/common.types").AuthProvider;
        isEmailVerified: boolean;
        status: import("../../types/common.types").UserStatus;
        lastLoginAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    unlockUser(targetUserId: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | undefined;
        address: string | undefined;
        role: UserRole;
        branchId: string | undefined;
        avatarUrl: string | undefined;
        authProvider: import("../../types/common.types").AuthProvider;
        isEmailVerified: boolean;
        status: import("../../types/common.types").UserStatus;
        lastLoginAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changeUserRole(targetUserId: string, adminUserId: string, data: {
        role: UserRole;
        branchId?: string;
    }): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | undefined;
        address: string | undefined;
        role: UserRole;
        branchId: string | undefined;
        avatarUrl: string | undefined;
        authProvider: import("../../types/common.types").AuthProvider;
        isEmailVerified: boolean;
        status: import("../../types/common.types").UserStatus;
        lastLoginAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export declare const adminUserService: AdminUserService;
export {};
//# sourceMappingURL=admin-user.service.d.ts.map