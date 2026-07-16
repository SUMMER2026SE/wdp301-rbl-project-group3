import { IBranch } from '../../models/branch.model';
export declare class BranchService {
    createBranch(data: Partial<IBranch>): Promise<IBranch>;
    getBranches(filters: {
        status?: string;
        keyword?: string;
    }): Promise<IBranch[]>;
    getBranchById(id: string): Promise<IBranch>;
    updateBranch(id: string, data: Partial<IBranch>, caller: {
        role: string;
        branchId?: string;
        email?: string;
    }): Promise<IBranch>;
    deactivateBranch(id: string): Promise<IBranch>;
    getBranchQuickStats(branchId: string, caller: {
        role: string;
        branchId?: string;
    }): Promise<{
        employeeCount: number;
        productCount: number;
        todayRevenue: number;
        todayOrderCount: number;
    }>;
}
export declare const branchService: BranchService;
//# sourceMappingURL=branch.service.d.ts.map