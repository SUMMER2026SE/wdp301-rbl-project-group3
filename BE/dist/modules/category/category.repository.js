"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRepository = exports.CategoryRepository = void 0;
const category_model_1 = require("../../models/category.model");
class CategoryRepository {
    async create(data) {
        return new category_model_1.Category(data).save();
    }
    async findAll(filters) {
        const query = {};
        if (filters.status)
            query.status = filters.status;
        if (filters.keyword) {
            query.$or = [
                { name: { $regex: filters.keyword, $options: 'i' } },
                { code: { $regex: filters.keyword, $options: 'i' } },
            ];
        }
        return category_model_1.Category.find(query).sort({ createdAt: -1 }).exec();
    }
    async findById(id) {
        return category_model_1.Category.findById(id).exec();
    }
    async findByCode(code) {
        return category_model_1.Category.findOne({ code: code.toUpperCase() }).exec();
    }
    async updateById(id, data) {
        return category_model_1.Category.findByIdAndUpdate(id, data, { new: true }).exec();
    }
}
exports.CategoryRepository = CategoryRepository;
exports.categoryRepository = new CategoryRepository();
//# sourceMappingURL=category.repository.js.map