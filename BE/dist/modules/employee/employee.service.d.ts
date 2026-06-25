import { UserStatus } from '../../types/common.types';
import { BackOfficeActor } from '../../utils/backOfficeAccess.util';
type EmployeeRole = 'branch_manager' | 'staff';
export declare class EmployeeService {
    listEmployees(filters: {
        page: number;
        limit: number;
        keyword?: string;
        branchId?: string;
        role?: EmployeeRole;
        status?: UserStatus;
    }, actor: BackOfficeActor): Promise<{
        employees: {
            id: string;
            fullName: string;
            email: string;
            phone: string | null;
            address: string | null;
            role: import("../../types/common.types").UserRole;
            status: UserStatus;
            branch: {
                id: string;
                name: string | undefined;
                code: string | undefined;
                address: string | undefined;
                status: string | undefined;
            } | {
                id: string;
                name?: undefined;
                code?: undefined;
                address?: undefined;
                status?: undefined;
            } | null;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getEmployee(id: string, actor: BackOfficeActor): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        address: string | null;
        role: import("../../types/common.types").UserRole;
        status: UserStatus;
        branch: {
            id: string;
            name: string | undefined;
            code: string | undefined;
            address: string | undefined;
            status: string | undefined;
        } | {
            id: string;
            name?: undefined;
            code?: undefined;
            address?: undefined;
            status?: undefined;
        } | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createEmployee(data: {
        fullName: string;
        email: string;
        password: string;
        phone?: string;
        address?: string;
        role: EmployeeRole;
        branchId: string;
        status: 'active' | 'inactive';
    }, actor: BackOfficeActor): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        address: string | null;
        role: import("../../types/common.types").UserRole;
        status: UserStatus;
        branch: {
            id: string;
            name: string | undefined;
            code: string | undefined;
            address: string | undefined;
            status: string | undefined;
        } | {
            id: string;
            name?: undefined;
            code?: undefined;
            address?: undefined;
            status?: undefined;
        } | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateEmployee(id: string, data: {
        fullName?: string;
        email?: string;
        password?: string;
        phone?: string | null;
        address?: string | null;
        role?: EmployeeRole;
        branchId?: string;
        status?: UserStatus;
    }, actor: BackOfficeActor): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        address: string | null;
        role: import("../../types/common.types").UserRole;
        status: UserStatus;
        branch: {
            id: string;
            name: string | undefined;
            code: string | undefined;
            address: string | undefined;
            status: string | undefined;
        } | {
            id: string;
            name?: undefined;
            code?: undefined;
            address?: undefined;
            status?: undefined;
        } | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deactivateEmployee(id: string, actor: BackOfficeActor): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        address: string | null;
        role: import("../../types/common.types").UserRole;
        status: UserStatus;
        branch: {
            id: string;
            name: string | undefined;
            code: string | undefined;
            address: string | undefined;
            status: string | undefined;
        } | {
            id: string;
            name?: undefined;
            code?: undefined;
            address?: undefined;
            status?: undefined;
        } | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private getAccessibleEmployee;
    private assertRoleCanBeManaged;
    private ensureActiveBranch;
    private syncBranchManagerAssignment;
}
export declare const employeeService: EmployeeService;
export {};
//# sourceMappingURL=employee.service.d.ts.map