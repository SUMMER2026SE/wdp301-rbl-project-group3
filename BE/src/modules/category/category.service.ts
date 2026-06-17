import { categoryRepository } from './category.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { ICategory } from '../../models/category.model';
import { Product } from '../../models/product.model';

export class CategoryService {
  async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    const code = String(data.code).toUpperCase();
    const existing = await categoryRepository.findByCode(code);
    if (existing) throw new AppError('Category code already exists', 409);

    return categoryRepository.create({
      ...data,
      code,
    });
  }

  async getCategories(filters: { status?: string; keyword?: string }): Promise<ICategory[]> {
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
    return updated;
  }
}

export const categoryService = new CategoryService();
