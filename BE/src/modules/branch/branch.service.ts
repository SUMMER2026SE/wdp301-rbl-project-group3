import { branchRepository } from './branch.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IBranch } from '../../models/branch.model';
import { Types } from 'mongoose';
import { User } from '../../models/user.model';
import { Inventory } from '../../models/inventory.model';
import { Order } from '../../models/order.model';

export class BranchService {
  async createBranch(data: Partial<IBranch>): Promise<IBranch> {
    const existing = await branchRepository.findByCode(String(data.code));
    if (existing) throw new AppError('Branch code already exists', 409);

    return branchRepository.create({
      ...data,
      code: String(data.code).toUpperCase(),
    });
  }

  async getBranches(filters: { status?: string; keyword?: string }): Promise<IBranch[]> {
    return branchRepository.findAll(filters);
  }

  async getBranchById(id: string): Promise<IBranch> {
    const branch = await branchRepository.findById(id);
    if (!branch) throw new AppError('Branch not found', 404);
    return branch;
  }

  async updateBranch(
    id: string,
    data: Partial<IBranch>,
    caller: { role: string; branchId?: string; email?: string }
  ): Promise<IBranch> {
    if (caller.role === 'branch_manager') {
      if (caller.branchId !== id) {
        throw new AppError('You can only update your own branch.', 403);
      }

      // Check if trying to update forbidden fields
      const forbiddenFields = ['name', 'code', 'address', 'managerId', 'status'];
      const keys = Object.keys(data);
      const containsForbidden = keys.some((key) => forbiddenFields.includes(key));
      if (containsForbidden) {
        throw new AppError(
          'You are not authorized to update core branch fields (name, code, address, manager, status)',
          403
        );
      }
    } else if (caller.role !== 'admin') {
      throw new AppError('Insufficient permissions', 403);
    }

    if (data.code) {
      const existing = await branchRepository.findByCode(String(data.code));
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Branch code already exists', 409);
      }
      data.code = String(data.code).toUpperCase();
    }

    const updated = await branchRepository.updateById(id, data);
    if (!updated) throw new AppError('Branch not found', 404);
    return updated;
  }

  async deactivateBranch(id: string): Promise<IBranch> {
    const updated = await branchRepository.updateById(id, { status: 'inactive' });
    if (!updated) throw new AppError('Branch not found', 404);
    return updated;
  }

  async getBranchQuickStats(
    branchId: string,
    caller: { role: string; branchId?: string }
  ) {
    if (caller.role !== 'admin' && caller.branchId !== branchId) {
      throw new AppError('You are not authorized to view this branch\'s statistics', 403);
    }

    const branchObjectId = new Types.ObjectId(branchId);

    // 1. Count Active Employees
    const employeeCount = await User.countDocuments({
      branchId: branchObjectId,
      role: { $in: ['branch_manager', 'staff'] },
      status: 'active',
    }).exec();

    // 2. Count Inventory items
    const productCount = await Inventory.countDocuments({
      branchId: branchObjectId,
    }).exec();

    // 3. Count Today's Orders and calculate Revenue
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayOrders = await Order.find({
      branchId: branchObjectId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    }).select('totalAmount').exec();

    const todayOrderCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      employeeCount,
      productCount,
      todayRevenue,
      todayOrderCount,
    };
  }
}

export const branchService = new BranchService();
