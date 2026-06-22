"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryService = exports.CategoryService = void 0;
const category_repository_1 = require("./category.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const product_model_1 = require("../../models/product.model");
class CategoryService {
    async createCategory(data) {
        const code = String(data.code).toUpperCase();
        const existing = await category_repository_1.categoryRepository.findByCode(code);
        if (existing)
            throw new errorHandler_middleware_1.AppError('Category code already exists', 409);
        return category_repository_1.categoryRepository.create({
            ...data,
            code,
        });
    }
    async getCategories(filters) {
        return category_repository_1.categoryRepository.findAll(filters);
    }
    async getCategoryById(id) {
        const category = await category_repository_1.categoryRepository.findById(id);
        if (!category)
            throw new errorHandler_middleware_1.AppError('Category not found', 404);
        return category;
    }
    async updateCategory(id, data) {
        if (data.code) {
            const code = String(data.code).toUpperCase();
            const existing = await category_repository_1.categoryRepository.findByCode(code);
            if (existing && existing._id.toString() !== id) {
                throw new errorHandler_middleware_1.AppError('Category code already exists', 409);
            }
            data.code = code;
        }
        const updated = await category_repository_1.categoryRepository.updateById(id, data);
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Category not found', 404);
        return updated;
    }
    async deleteCategory(id) {
        await this.getCategoryById(id);
        const productCount = await product_model_1.Product.countDocuments({ categoryId: id }).exec();
        if (productCount > 0) {
            throw new errorHandler_middleware_1.AppError('Category is in use by products', 409);
        }
        const updated = await category_repository_1.categoryRepository.updateById(id, { status: 'inactive' });
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Category not found', 404);
        return updated;
    }
}
exports.CategoryService = CategoryService;
exports.categoryService = new CategoryService();
//# sourceMappingURL=category.service.js.map