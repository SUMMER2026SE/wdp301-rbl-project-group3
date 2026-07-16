import { AppError } from '../middlewares/errorHandler.middleware';
import { User } from '../models/user.model';
import { UserRole } from '../types/common.types';

export interface BackOfficeActor {
  userId: string;
  role: UserRole;
}

export async function resolveBackOfficeBranch(
  actor: BackOfficeActor,
  requestedBranchId?: string,
  requireBranchForAdmin = false
): Promise<string | undefined> {
  const user = await User.findById(actor.userId)
    .select('role branchId status')
    .lean()
    .exec();

  if (!user || user.status !== 'active') {
    throw new AppError('Active back-office account required', 403);
  }

  if (user.role !== actor.role) {
    throw new AppError('Account permissions changed. Please login again.', 401);
  }

  if (actor.role === 'admin') {
    if (requireBranchForAdmin && !requestedBranchId) {
      throw new AppError('branchId is required', 400);
    }
    return requestedBranchId;
  }

  if (!user.branchId) {
    throw new AppError('No branch is assigned to this account', 403);
  }

  const assignedBranchId = user.branchId.toString();
  if (requestedBranchId && requestedBranchId !== assignedBranchId) {
    throw new AppError('You cannot access another branch', 403);
  }

  return assignedBranchId;
}

export async function assertBackOfficeBranchAccess(
  actor: BackOfficeActor,
  branchId: string
): Promise<void> {
  await resolveBackOfficeBranch(actor, branchId, true);
}
