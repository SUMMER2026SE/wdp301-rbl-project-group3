import { Types } from 'mongoose';
import { IUser } from '../../models/user.model';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { UserRole } from '../../types/common.types';
import { branchService } from '../branch/branch.service';
import { adminUserRepository } from './admin-user.repository';

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

function toAdminUserResponse(user: IUser) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    branchId: user.branchId?.toString(),
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider,
    isEmailVerified: user.isEmailVerified,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AdminUserService {
  async listUsers(query: ListUsersQuery): Promise<ListUsersResult> {
    const { items, total, page, limit, totalPages } = await adminUserRepository.findPaginated(
      { keyword: query.keyword, role: query.role, status: query.status },
      query.page,
      query.limit
    );

    return {
      users: items.map(toAdminUserResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async lockUser(targetUserId: string, adminUserId: string) {
    if (targetUserId === adminUserId) {
      throw new AppError('You cannot lock your own account', 400);
    }

    const user = await adminUserRepository.findById(targetUserId);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Cannot lock an admin account', 403);
    if (user.status === 'banned') throw new AppError('User is already locked', 400);

    const updated = await adminUserRepository.updateStatusById(targetUserId, 'banned', true);
    if (!updated) throw new AppError('User not found', 404);

    return toAdminUserResponse(updated);
  }

  async unlockUser(targetUserId: string) {
    const user = await adminUserRepository.findById(targetUserId);
    if (!user) throw new AppError('User not found', 404);
    if (user.status === 'active') throw new AppError('User is already active', 400);

    const updated = await adminUserRepository.updateStatusById(targetUserId, 'active');
    if (!updated) throw new AppError('User not found', 404);

    return toAdminUserResponse(updated);
  }

  async changeUserRole(
    targetUserId: string,
    adminUserId: string,
    data: { role: UserRole; branchId?: string }
  ) {
    if (targetUserId === adminUserId) {
      throw new AppError('You cannot change your own role', 400);
    }

    const user = await adminUserRepository.findById(targetUserId);
    if (!user) throw new AppError('User not found', 404);

    if (user.role === data.role) {
      throw new AppError('User already has this role', 400);
    }

    const branchScopedRoles: UserRole[] = ['branch_manager', 'staff'];
    let branchObjectId: Types.ObjectId | null | undefined;

    if (branchScopedRoles.includes(data.role)) {
      if (!data.branchId) {
        throw new AppError('branchId is required for branch_manager and staff roles', 400);
      }
      await branchService.getBranchById(data.branchId);
      branchObjectId = new Types.ObjectId(data.branchId);
    } else {
      branchObjectId = null;
    }

    const updated = await adminUserRepository.updateRoleById(
      targetUserId,
      data.role,
      branchObjectId
    );
    if (!updated) throw new AppError('User not found', 404);

    return toAdminUserResponse(updated);
  }
}

export const adminUserService = new AdminUserService();
