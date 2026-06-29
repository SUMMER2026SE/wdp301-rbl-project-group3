import { Types } from 'mongoose';
import { IUser, User } from '../../models/user.model';
import { UserRole, UserStatus } from '../../types/common.types';

export interface EmployeeFilters {
  keyword?: string;
  branchId?: string;
  role?: 'branch_manager' | 'staff';
  status?: UserStatus;
}

const employeeProjection =
  '-passwordHash -emailVerifyToken -emailVerifyTokenExpires';

export class EmployeeRepository {
  async findPaginated(filters: EmployeeFilters, page: number, limit: number) {
    const query: Record<string, unknown> = {
      role: filters.role || { $in: ['branch_manager', 'staff'] },
    };

    if (filters.branchId) query.branchId = new Types.ObjectId(filters.branchId);
    if (filters.status) query.status = filters.status;
    if (filters.keyword) {
      query.$or = [
        { fullName: { $regex: filters.keyword, $options: 'i' } },
        { email: { $regex: filters.keyword, $options: 'i' } },
        { phone: { $regex: filters.keyword, $options: 'i' } },
      ];
    }

    const [employees, total] = await Promise.all([
      User.find(query)
        .select(employeeProjection)
        .populate('branchId', 'name code address status')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      User.countDocuments(query).exec(),
    ]);

    return {
      employees,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id)
      .select(employeeProjection)
      .populate('branchId', 'name code address status')
      .exec();
  }

  async findRawById(id: string): Promise<IUser | null> {
    return User.findById(id).select(employeeProjection).exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select(employeeProjection).exec();
  }

  async create(data: {
    id: string;
    fullName: string;
    email: string;
    passwordHash: string;
    phone?: string;
    address?: string;
    role: 'branch_manager' | 'staff';
    branchId: string;
    status: 'active' | 'inactive';
  }): Promise<IUser> {
    const { id, ...employeeData } = data;
    return new User({
      ...employeeData,
      _id: new Types.ObjectId(id),
      email: employeeData.email.toLowerCase(),
      branchId: new Types.ObjectId(employeeData.branchId),
      authProvider: 'local',
      isEmailVerified: true,
    }).save();
  }

  async deleteFreshEmployee(id: string): Promise<void> {
    await User.deleteOne({ _id: id, lastLoginAt: { $exists: false } }).exec();
  }

  async update(
    id: string,
    data: {
      fullName?: string;
      email?: string;
      passwordHash?: string;
      passwordChangedAt?: Date;
      phone?: string | null;
      address?: string | null;
      role?: UserRole;
      branchId?: string;
      status?: UserStatus;
    },
    revokeSessions: boolean
  ): Promise<IUser | null> {
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (value === null) {
        $unset[key] = 1;
      } else if (key === 'branchId') {
        $set[key] = new Types.ObjectId(String(value));
      } else if (key === 'email') {
        $set[key] = String(value).toLowerCase();
      } else {
        $set[key] = value;
      }
    }

    const update: Record<string, unknown> = {};
    if (Object.keys($set).length > 0) update.$set = $set;
    if (Object.keys($unset).length > 0) update.$unset = $unset;
    if (revokeSessions) update.$inc = { refreshTokenVersion: 1 };

    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select(employeeProjection)
      .populate('branchId', 'name code address status')
      .exec();
  }
}

export const employeeRepository = new EmployeeRepository();
