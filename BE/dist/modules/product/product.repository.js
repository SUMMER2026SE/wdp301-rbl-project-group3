"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = exports.ProductRepository = void 0;
const product_model_1 = require("../../models/product.model");
class ProductRepository {
    async create(data) {
        return new product_model_1.Product(data).save();
    }
    async findPaginated(filters, page, limit) {
        const query = {};
        if (filters.status)
            query.status = filters.status;
        if (filters.categoryId)
            query.categoryId = filters.categoryId;
        if (filters.keyword) {
            query.$or = [
                { name: { $regex: filters.keyword, $options: 'i' } },
                { sku: { $regex: filters.keyword, $options: 'i' } },
                { description: { $regex: filters.keyword, $options: 'i' } },
            ];
        }
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            const salePriceQuery = {};
            const legacyPriceQuery = {};
            if (filters.minPrice !== undefined) {
                salePriceQuery.$gte = filters.minPrice;
                legacyPriceQuery.$gte = filters.minPrice;
            }
            if (filters.maxPrice !== undefined) {
                salePriceQuery.$lte = filters.maxPrice;
                legacyPriceQuery.$lte = filters.maxPrice;
            }
            query.$and = [
                ...(Array.isArray(query.$and) ? query.$and : []),
                { $or: [{ salePrice: salePriceQuery }, { price: legacyPriceQuery }] },
            ];
        }
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            product_model_1.Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            product_model_1.Product.countDocuments(query).exec(),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        };
    }
    async findById(id) {
        return product_model_1.Product.findById(id).exec();
    }
    async findBySku(sku) {
        return product_model_1.Product.findOne({ sku: sku.toUpperCase() }).exec();
    }
    async updateById(id, data) {
        return product_model_1.Product.findByIdAndUpdate(id, data, { new: true }).exec();
    }
}
exports.ProductRepository = ProductRepository;
exports.productRepository = new ProductRepository();
//# sourceMappingURL=product.repository.js.map