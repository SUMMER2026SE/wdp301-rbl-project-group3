import { Category, ICategory } from '../../models/category.model';

export class CategoryRepository {
  async create(data: Partial<ICategory>): Promise<ICategory> {
    return new Category(data).save();
  }

  async findAll(filters: { status?: string; keyword?: string }): Promise<ICategory[]> {
    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.keyword) {
      query.$or = [
        { name: { $regex: filters.keyword, $options: 'i' } },
        { code: { $regex: filters.keyword, $options: 'i' } },
      ];
    }

    return Category.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<ICategory | null> {
    return Category.findById(id).exec();
  }

  async findByCode(code: string): Promise<ICategory | null> {
    return Category.findOne({ code: code.toUpperCase() }).exec();
  }

  async updateById(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}

export const categoryRepository = new CategoryRepository();
