"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitorProductService = exports.CompetitorProductService = void 0;
const competitor_product_model_1 = require("../../models/competitor-product.model");
const product_model_1 = require("../../models/product.model");
const sku_util_1 = require("../../utils/sku.util");
const string_util_1 = require("../../utils/string.util");
class CompetitorProductService {
    async getCompetitorProducts(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.keyword) {
            const searchRegex = new RegExp(query.keyword, 'i');
            filter.$or = [
                { name: searchRegex },
                { brand: searchRegex },
                { sku: searchRegex }
            ];
        }
        const items = await competitor_product_model_1.CompetitorProduct.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await competitor_product_model_1.CompetitorProduct.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }
    async importToCatalog(ids) {
        const cpList = await competitor_product_model_1.CompetitorProduct.find({ _id: { $in: ids } });
        let importedCount = 0;
        for (const cp of cpList) {
            // Check if product with this normalized combination already exists in Product to prevent duplicates
            const normalizedName = cp.normalizedName || (0, string_util_1.normalizeString)(cp.name);
            const normalizedBrand = cp.normalizedBrand || (cp.brand ? (0, string_util_1.normalizeString)(cp.brand) : undefined);
            const normalizedUnit = cp.normalizedUnit || (0, string_util_1.normalizeString)(cp.unit || 'item');
            const existingProduct = await product_model_1.Product.findOne({
                normalizedName,
                normalizedBrand,
                normalizedUnit
            });
            if (existingProduct) {
                // If it exists, skip importing to prevent duplication
                continue;
            }
            // Auto-generate system SKU (e.g. PM123456)
            const sku = await (0, sku_util_1.generateUniqueSku)();
            // Create new Product
            await product_model_1.Product.create({
                name: cp.name,
                brand: cp.brand,
                sku,
                costPrice: 0,
                salePrice: 0,
                unit: cp.unit || 'item',
                description: cp.description,
                imageUrl: cp.imageUrl,
                status: 'active',
                normalizedName,
                normalizedBrand,
                normalizedUnit,
            });
            importedCount++;
        }
        return { importedCount };
    }
}
exports.CompetitorProductService = CompetitorProductService;
exports.competitorProductService = new CompetitorProductService();
//# sourceMappingURL=competitor-product.service.js.map