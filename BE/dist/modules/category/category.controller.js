"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = exports.CategoryController = void 0;
const category_service_1 = require("./category.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class CategoryController {
    constructor() {
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const category = await category_service_1.categoryService.createCategory(req.body);
            (0, response_util_1.sendSuccess)(res, { category }, 'Category created', 201);
        });
        this.getAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const categories = await category_service_1.categoryService.getCategories({
                status: req.query.status,
                keyword: req.query.keyword,
            });
            (0, response_util_1.sendSuccess)(res, { categories }, 'Categories retrieved');
        });
        this.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const category = await category_service_1.categoryService.getCategoryById(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { category }, 'Category retrieved');
        });
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const category = await category_service_1.categoryService.updateCategory(String(req.params.id), req.body);
            (0, response_util_1.sendSuccess)(res, { category }, 'Category updated');
        });
        this.delete = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const category = await category_service_1.categoryService.deleteCategory(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { category }, 'Category deleted');
        });
    }
}
exports.CategoryController = CategoryController;
exports.categoryController = new CategoryController();
//# sourceMappingURL=category.controller.js.map