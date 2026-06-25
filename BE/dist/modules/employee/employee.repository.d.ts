import { Types } from 'mongoose';
import { IUser } from '../../models/user.model';
import { UserRole, UserStatus } from '../../types/common.types';
export interface EmployeeFilters {
    keyword?: string;
    branchId?: string;
    role?: 'branch_manager' | 'staff';
    status?: UserStatus;
}
export declare class EmployeeRepository {
    findPaginated(filters: EmployeeFilters, page: number, limit: number): Promise<{
        employees: (import("mongoose").Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<IUser | null>;
    findRawById(id: string): Promise<IUser | null>;
    findByEmail(email: string): Promise<IUser | null>;
    create(data: {
        id: string;
        fullName: string;
        email: string;
        passwordHash: string;
        phone?: string;
        address?: string;
        role: 'branch_manager' | 'staff';
        branchId: string;
        status: 'active' | 'inactive';
    }): Promise<IUser>;
    deleteFreshEmployee(id: string): Promise<void>;
    update(id: string, data: {
        fullName?: string;
        email?: string;
        passwordHash?: string;
        passwordChangedAt?: Date;
        phone?: string | null;
        address?: string | null;
        role?: UserRole;
        branchId?: string;
        status?: UserStatus;
    }, revokeSessions: boolean): Promise<IUser | null>;
}
export declare const employeeRepository: EmployeeRepository;
//# sourceMappingURL=employee.repository.d.ts.map