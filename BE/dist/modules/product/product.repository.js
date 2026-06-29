"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepository = exports.ProductRepository = void 0;
const product_model_1 = require("../../models/product.model");
const inventory_model_1 = require("../../models/inventory.model");
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
        // Lọc theo chi nhánh - chỉ lấy sản phẩm có tồn kho
        if (filters.branchId) {
            const inventories = await inventory_model_1.Inventory.find({
                branchId: filters.branchId,
                quantity: { $gt: 0 }
            }).select('productId').exec();
            const productIds = inventories.map(inv => inv.productId);
            query._id = { $in: productIds };
        }
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
        const [products, total] = await Promise.all([
            product_model_1.Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            product_model_1.Product.countDocuments(query).exec(),
        ]);
        // Lấy giá bán thực tế từ Inventory (lastImportCost)
        const items = [];
        for (const product of products) {
            let actualPrice = product.salePrice || 0;
            if (filters.branchId) {
                const inventory = await inventory_model_1.Inventory.findOne({
                    branchId: filters.branchId,
                    productId: product._id
                }).select('lastImportCost').lean().exec();
                // Dùng lastImportCost làm giá bán nếu có
                if (inventory?.lastImportCost) {
                    actualPrice = inventory.lastImportCost;
                }
            }
            items.push({
                ...product,
                price: actualPrice, // Giá hiển thị cho khách
                salePrice: actualPrice,
            });
        }
        return {
            items: items,
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