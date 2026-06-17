import { Branch, IBranch } from '../../models/branch.model';

export class BranchRepository {
  async create(data: Partial<IBranch>): Promise<IBranch> {
    return new Branch(data).save();
  }

  async findAll(filters: { status?: string; keyword?: string }): Promise<IBranch[]> {
    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.keyword) {
      query.$or = [
        { name: { $regex: filters.keyword, $options: 'i' } },
        { code: { $regex: filters.keyword, $options: 'i' } },
        { address: { $regex: filters.keyword, $options: 'i' } },
      ];
    }

    return Branch.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<IBranch | null> {
    return Branch.findById(id).exec();
  }

  async findByCode(code: string): Promise<IBranch | null> {
    return Branch.findOne({ code: code.toUpperCase() }).exec();
  }

  async updateById(id: string, data: Partial<IBranch>): Promise<IBranch | null> {
    return Branch.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}

export const branchRepository = new BranchRepository();
