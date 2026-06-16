import { IBranch } from '../../models/branch.model';
export declare class BranchService {
    createBranch(data: Partial<IBranch>): Promise<IBranch>;
    getBranches(filters: {
        status?: string;
        keyword?: string;
    }): Promise<IBranch[]>;
    getBranchById(id: string): Promise<IBranch>;
    updateBranch(id: string, data: Partial<IBranch>): Promise<IBranch>;
    deactivateBranch(id: string): Promise<IBranch>;
}
export declare const branchService: BranchService;
//# sourceMappingURL=branch.service.d.ts.map