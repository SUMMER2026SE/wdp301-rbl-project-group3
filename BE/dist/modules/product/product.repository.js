"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = exports.ProductRepository = void 0;
const product_model_1 = require("../../models/product.model");
class ProductRepository {
    async create(data) {
        return new product_model_1.Product(data).save();
    }
    async findAll(filters) {
        const query = {};
        if (filters.status)
            query.status = filters.status;
        if (filters.keyword) {
            query.$or = [
                { name: { $regex: filters.keyword, $options: 'i' } },
                { sku: { $regex: filters.keyword, $options: 'i' } },
            ];
        }
        return product_model_1.Product.find(query).sort({ createdAt: -1 }).exec();
    }
    async findById(id) {
        return product_model_1.Product.findById(id).exec();
    }
    async findBySku(sku) {
        return product_model_1.Product.findOne({ sku: sku.toUpperCase() }).exec();
    }
}
exports.ProductRepository = ProductRepository;
exports.productRepository = new ProductRepository();
//# sourceMappingURL=product.repository.js.map