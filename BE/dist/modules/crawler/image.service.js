"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlerImageService = exports.CrawlerImageService = void 0;
const cloudinary_config_1 = require("../../config/cloudinary.config");
class CrawlerImageService {
    /**
     * Upload an image from a URL to Cloudinary and return the secure_url
     */
    async uploadFromUrl(imageUrl, sku) {
        try {
            if (!imageUrl || !imageUrl.startsWith('http'))
                return null;
            // Cloudinary has an easy way to upload directly from an external URL
            const result = await cloudinary_config_1.cloudinary.uploader.upload(imageUrl, {
                folder: 'winmart_products',
                public_id: sku,
                overwrite: true,
            });
            return result.secure_url;
        }
        catch (error) {
            console.error(`Failed to upload image to Cloudinary for SKU ${sku}:`, error);
            return null;
        }
    }
}
exports.CrawlerImageService = CrawlerImageService;
exports.crawlerImageService = new CrawlerImageService();
//# sourceMappingURL=image.service.js.map