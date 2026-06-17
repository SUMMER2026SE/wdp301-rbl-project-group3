"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = exports.ProductService = void 0;
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const product_repository_1 = require("./product.repository");
class ProductService {
    async createProduct(data) {
        const existing = await product_repository_1.productRepository.findBySku(String(data.sku));
        if (existing)
            throw new errorHandler_middleware_1.AppError('Product SKU already exists', 409);
        return product_repository_1.productRepository.create({
            ...data,
            sku: String(data.sku).toUpperCase(),
            unit: data.unit || 'item',
            salePrice: data.salePrice ?? 0,
        });
    }
    async getProducts(filters) {
        return product_repository_1.productRepository.findAll(filters);
    }
    async ensureProductExists(id) {
        const product = await product_repository_1.productRepository.findById(id);
        if (!product)
            throw new errorHandler_middleware_1.AppError('Product not found', 404);
        return product;
    }
}
exports.ProductService = ProductService;
exports.productService = new ProductService();
//# sourceMappingURL=product.service.js.map