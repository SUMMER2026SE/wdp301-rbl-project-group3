import { Types } from 'mongoose';
import { User, IUser } from '../../models/user.model';
import { UserRole, UserStatus } from '../../types/common.types';

export interface AdminUserListFilters {
  keyword?: string;
  role?: string;
  status?: string;
}

export interface PaginatedUsers {
  items: IUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const userListProjection = '-passwordHash -emailVerifyToken -emailVerifyTokenExpires';

export class AdminUserRepository {
  async findPaginated(
    filters: AdminUserListFilters,
    page: number,
    limit: number
  ): Promise<PaginatedUsers> {
    const query: Record<string, unknown> = {};

    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    if (filters.keyword) {
      query.$or = [
        { fullName: { $regex: filters.keyword, $options: 'i' } },
        { email: { $regex: filters.keyword, $options: 'i' } },
        { phone: { $regex: filters.keyword, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find(query)
        .select(userListProjection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      User.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).select(userListProjection).exec();
  }

  async updateStatusById(
    id: string,
    status: UserStatus,
    incrementTokenVersion = false
  ): Promise<IUser | null> {
    const update: Record<string, unknown> = { $set: { status } };
    if (incrementTokenVersion) {
      update.$inc = { refreshTokenVersion: 1 };
    }

    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select(userListProjection)
      .exec();
  }

  async updateRoleById(
    id: string,
    role: UserRole,
    branchId?: Types.ObjectId | null
  ): Promise<IUser | null> {
    const update: Record<string, unknown> = {
      $set: { role },
      $inc: { refreshTokenVersion: 1 },
    };

    if (branchId === null) {
      update.$unset = { branchId: '' };
    } else if (branchId) {
      (update.$set as Record<string, unknown>).branchId = branchId;
    }

    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select(userListProjection)
      .exec();
  }
}

export const adminUserRepository = new AdminUserRepository();
