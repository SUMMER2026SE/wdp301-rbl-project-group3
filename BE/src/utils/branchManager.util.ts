import { Types } from 'mongoose';
import { AppError } from '../middlewares/errorHandler.middleware';
import { Branch } from '../models/branch.model';
import { User } from '../models/user.model';

export async function claimBranchManager(
  branchId: string,
  employeeId: string
): Promise<void> {
  const branch = await Branch.findById(branchId).select('managerId status').lean().exec();
  if (!branch || branch.status !== 'active') {
    throw new AppError('Active branch not found', 404);
  }

  const existingManager = await User.findOne({
    _id: { $ne: employeeId },
    branchId,
    role: 'branch_manager',
    status: 'active',
  })
    .select('_id')
    .lean()
    .exec();
  if (existingManager) {
    throw new AppError('This branch already has a manager', 409);
  }

  let staleManagerId: Types.ObjectId | undefined;
  if (
    branch.managerId &&
    branch.managerId.toString() !== employeeId
  ) {
    const referencedManager = await User.findById(branch.managerId)
      .select('role branchId status')
      .lean()
      .exec();
    const assignmentIsValid =
      referencedManager?.status === 'active' &&
      referencedManager.role === 'branch_manager' &&
      referencedManager.branchId?.toString() === branchId;
    if (assignmentIsValid) {
      throw new AppError('This branch already has a manager', 409);
    }
    staleManagerId = branch.managerId;
  }

  const managerConditions: Record<string, unknown>[] = [
    { managerId: { $exists: false } },
    { managerId: null },
    { managerId: new Types.ObjectId(employeeId) },
  ];
  if (staleManagerId) managerConditions.push({ managerId: staleManagerId });

  const claimed = await Branch.findOneAndUpdate(
    {
      _id: branchId,
      status: 'active',
      $or: managerConditions,
    },
    { $set: { managerId: new Types.ObjectId(employeeId) } },
    { new: true }
  ).exec();
  if (!claimed) {
    throw new AppError('This branch already has a manager', 409);
  }
}

export async function releaseBranchManager(
  branchId: string,
  employeeId: string
): Promise<void> {
  await Branch.updateOne(
    { _id: branchId, managerId: employeeId },
    { $unset: { managerId: 1 } }
  ).exec();
}

export async function releaseBranchManagerWithRetry(
  branchId: string,
  employeeId: string
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await releaseBranchManager(branchId, employeeId);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  console.error('[BRANCH_MANAGER_RELEASE_FAILED]', {
    branchId,
    employeeId,
    error: lastError,
  });
}
