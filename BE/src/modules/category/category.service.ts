import { categoryRepository } from './category.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { ICategory } from '../../models/category.model';
import { Product } from '../../models/product.model';
import { emitGlobal } from '../../config/socket.config';

export class CategoryService {
  async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    const code = String(data.code).toUpperCase();
    const existing = await categoryRepository.findByCode(code);
    if (existing) throw new AppError('Category code already exists', 409);

    const result = await categoryRepository.create({
      ...data,
      code,
    });
    emitGlobal('category:updated', result);
    return result;
  }

  async getCategories(filters: {
    status?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    if (filters.page !== undefined && filters.limit !== undefined) {
      const page = filters.page;
      const limit = filters.limit;
      const { categories, total } = await categoryRepository.findPaginated(filters, page, limit);
      const totalPages = Math.ceil(total / limit) || 1;
      return {
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    }
    return categoryRepository.findAll(filters);
  }

  async getCategoryById(id: string): Promise<ICategory> {
    const category = await categoryRepository.findById(id);
    if (!category) throw new AppError('Category not found', 404);
    return category;
  }

  async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory> {
    if (data.code) {
      const code = String(data.code).toUpperCase();
      const existing = await categoryRepository.findByCode(code);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Category code already exists', 409);
      }
      data.code = code;
    }

    const updated = await categoryRepository.updateById(id, data);
    if (!updated) throw new AppError('Category not found', 404);
    emitGlobal('category:updated', updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<ICategory> {
    await this.getCategoryById(id);

    const productCount = await Product.countDocuments({ categoryId: id }).exec();
    if (productCount > 0) {
      throw new AppError('Category is in use by products', 409);
    }

    const updated = await categoryRepository.updateById(id, { status: 'inactive' });
    if (!updated) throw new AppError('Category not found', 404);
    emitGlobal('category:updated', updated);
    return updated;
  }
}

export const categoryService = new CategoryService();
