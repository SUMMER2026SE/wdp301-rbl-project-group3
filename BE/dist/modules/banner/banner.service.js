"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannerService = exports.BannerService = void 0;
const mongoose_1 = require("mongoose");
const banner_repository_1 = require("./banner.repository");
const cloudinary_config_1 = require("../../config/cloudinary.config");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
class BannerService {
    uploadBannerImage(buffer, publicId) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_config_1.cloudinary.uploader.upload_stream({
                folder: 'minimart/banners',
                public_id: publicId,
                overwrite: true,
                resource_type: 'image',
                transformation: [{ width: 1200, height: 600, crop: 'limit' }],
            }, (error, uploadResult) => {
                if (error || !uploadResult) {
                    return reject(error || new Error('Image upload failed'));
                }
                resolve(uploadResult.secure_url);
            });
            uploadStream.end(buffer);
        });
    }
    async listBanners(filters, page, limit) {
        return banner_repository_1.bannerRepository.findPaginated(filters, page, limit);
    }
    async getActiveBanners() {
        return banner_repository_1.bannerRepository.findActiveBanners();
    }
    async getBannerById(id) {
        const banner = await banner_repository_1.bannerRepository.findById(id);
        if (!banner)
            throw new errorHandler_middleware_1.AppError('Banner not found', 404);
        return banner;
    }
    async createBanner(data, file, creatorId) {
        let imageUrl = data.imageUrl;
        if (file) {
            const timestamp = Date.now();
            imageUrl = await this.uploadBannerImage(file.buffer, `banner_${timestamp}`);
        }
        if (!imageUrl) {
            throw new errorHandler_middleware_1.AppError('Banner image is required', 400);
        }
        const createdBy = creatorId ? new mongoose_1.Types.ObjectId(creatorId) : undefined;
        return banner_repository_1.bannerRepository.create({
            ...data,
            imageUrl,
            createdBy,
        });
    }
    async updateBanner(id, data, file) {
        const banner = await this.getBannerById(id);
        const updateData = { ...data };
        if (file) {
            updateData.imageUrl = await this.uploadBannerImage(file.buffer, `banner_${banner._id.toString()}`);
        }
        const updated = await banner_repository_1.bannerRepository.updateById(id, updateData);
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Banner not found', 404);
        return updated;
    }
    async deleteBanner(id) {
        const banner = await banner_repository_1.bannerRepository.deleteById(id);
        if (!banner)
            throw new errorHandler_middleware_1.AppError('Banner not found', 404);
        return banner;
    }
}
exports.BannerService = BannerService;
exports.bannerService = new BannerService();
//# sourceMappingURL=banner.service.js.map