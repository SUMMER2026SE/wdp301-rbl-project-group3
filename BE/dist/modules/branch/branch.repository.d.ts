import { IBranch } from '../../models/branch.model';
export declare class BranchRepository {
    create(data: Partial<IBranch>): Promise<IBranch>;
    findAll(filters: {
        status?: string;
        keyword?: string;
    }): Promise<IBranch[]>;
    findById(id: string): Promise<IBranch | null>;
    findByCode(code: string): Promise<IBranch | null>;
    updateById(id: string, data: Partial<IBranch>): Promise<IBranch | null>;
}
export declare const branchRepository: BranchRepository;
//# sourceMappingURL=branch.repository.d.ts.map