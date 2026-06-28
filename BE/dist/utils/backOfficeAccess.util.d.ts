import { UserRole } from '../types/common.types';
export interface BackOfficeActor {
    userId: string;
    role: UserRole;
}
export declare function resolveBackOfficeBranch(actor: BackOfficeActor, requestedBranchId?: string, requireBranchForAdmin?: boolean): Promise<string | undefined>;
export declare function assertBackOfficeBranchAccess(actor: BackOfficeActor, branchId: string): Promise<void>;
//# sourceMappingURL=backOfficeAccess.util.d.ts.map