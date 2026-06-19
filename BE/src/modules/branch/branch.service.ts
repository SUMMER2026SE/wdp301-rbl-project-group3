import { branchRepository } from './branch.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IBranch } from '../../models/branch.model';

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

  async updateBranch(id: string, data: Partial<IBranch>): Promise<IBranch> {
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
}

export const branchService = new BranchService();
