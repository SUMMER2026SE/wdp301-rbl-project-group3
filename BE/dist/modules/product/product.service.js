"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = exports.ProductService = void 0;
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const product_repository_1 = require("./product.repository");
class ProductService {
    uploadProductImage(buffer, publicId) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_config_1.cloudinary.uploader.upload_stream({
                folder: 'minimart/products',
                public_id: publicId,
                overwrite: true,
                resource_type: 'image',
                transformation: [{ width: 800, height: 800, crop: 'limit' }],
            }, (error, uploadResult) => {
                if (error || !uploadResult) {
                    return reject(error || new Error('Image upload failed'));
                }
                resolve(uploadResult.secure_url);
            });
            uploadStream.end(buffer);
        });
    }
    async listProducts(query) {
        const { items, total, page, limit, totalPages } = await product_repository_1.productRepository.findPaginated({
            status: query.status,
            keyword: query.keyword,
            categoryId: query.categoryId,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            branchId: query.branchId,
        }, query.page, query.limit);
        return {
            products: items,
            pagination: { page, limit, total, totalPages },
        };
    }
    async createProduct(data, file) {
        const sku = String(data.sku).toUpperCase();
        const existing = await product_repository_1.productRepository.findBySku(sku);
        if (existing)
            throw new errorHandler_middleware_1.AppError('Product SKU already exists', 409);
        let imageUrl;
        if (file) {
            imageUrl = await this.uploadProductImage(file.buffer, `sku_${sku}`);
        }
        return product_repository_1.productRepository.create({
            ...data,
            sku,
            unit: data.unit || 'item',
            salePrice: data.salePrice ?? 0,
            imageUrl,
        });
    }
    async getProductById(id) {
        const product = await product_repository_1.productRepository.findById(id);
        if (!product)
            throw new errorHandler_middleware_1.AppError('Product not found', 404);
        return product;
    }
    async updateProduct(id, data, file) {
        await this.getProductById(id);
        const updateData = { ...data };
        if (updateData.sku) {
            const sku = String(updateData.sku).toUpperCase();
            const existing = await product_repository_1.productRepository.findBySku(sku);
            if (existing && existing._id.toString() !== id) {
                throw new errorHandler_middleware_1.AppError('Product SKU already exists', 409);
            }
            updateData.sku = sku;
        }
        if (file) {
            updateData.imageUrl = await this.uploadProductImage(file.buffer, `id_${id}`);
        }
        const hasUpdate = Object.values(updateData).some((value) => value !== undefined);
        if (!hasUpdate) {
            throw new errorHandler_middleware_1.AppError('No valid fields provided to update', 400);
        }
        const updated = await product_repository_1.productRepository.updateById(id, updateData);
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Product not found', 404);
        return updated;
    }
    async deleteProduct(id) {
        const updated = await product_repository_1.productRepository.updateById(id, { status: 'inactive' });
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Product not found', 404);
        return updated;
    }
    async ensureProductExists(id) {
        return this.getProductById(id);
    }
}
exports.ProductService = ProductService;
exports.productService = new ProductService();
//# sourceMappingURL=product.service.js.map