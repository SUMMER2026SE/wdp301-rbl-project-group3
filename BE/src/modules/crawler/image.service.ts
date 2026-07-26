import { cloudinary } from '../../config/cloudinary.config';

/**
 * Application service that coordinates business rules, authorization, and side effects.
 * Feature boundary: CrawlerImage.
 */
export class CrawlerImageService {
  /**
   * Upload an image from a URL to Cloudinary and return the secure_url
   */
  async uploadFromUrl(imageUrl: string, sku: string): Promise<string | null> {
    try {
      if (!imageUrl || !imageUrl.startsWith('http')) return null;

      // Cloudinary has an easy way to upload directly from an external URL
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: 'winmart_products',
        public_id: sku,
        overwrite: true,
      });

      return result.secure_url;
    } catch (error) {
      console.error(`Failed to upload image to Cloudinary for SKU ${sku}:`, error);
      return null;
    }
  }
}

export const crawlerImageService = new CrawlerImageService();
/**
 * Business-support component for the crawler feature.
 * It centralizes this concern so controllers and other modules reuse one consistent workflow.
 */
