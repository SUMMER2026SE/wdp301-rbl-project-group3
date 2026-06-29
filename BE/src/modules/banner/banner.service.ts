import { Types } from 'mongoose';
import { bannerRepository, BannerFilters, PaginatedBanners } from './banner.repository';
import { IBanner } from '../../models/banner.model';
import { cloudinary } from '../../config/cloudinary.config';
import { AppError } from '../../middlewares/errorHandler.middleware';

export class BannerService {
  private uploadBannerImage(buffer: Buffer, publicId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'minimart/banners',
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
          transformation: [{ width: 1200, height: 600, crop: 'limit' }],
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            return reject(error || new Error('Image upload failed'));
          }
          resolve(uploadResult.secure_url);
        }
      );
      uploadStream.end(buffer);
    });
  }

  async listBanners(filters: BannerFilters, page: number, limit: number): Promise<PaginatedBanners> {
    return bannerRepository.findPaginated(filters, page, limit);
  }

  async getActiveBanners(): Promise<IBanner[]> {
    return bannerRepository.findActiveBanners();
  }

  async getBannerById(id: string): Promise<IBanner> {
    const banner = await bannerRepository.findById(id);
    if (!banner) throw new AppError('Banner not found', 404);
    return banner;
  }

  async createBanner(data: any, file?: { buffer: Buffer; mimetype: string }, creatorId?: string): Promise<IBanner> {
    let imageUrl = data.imageUrl;

    if (file) {
      const timestamp = Date.now();
      imageUrl = await this.uploadBannerImage(file.buffer, `banner_${timestamp}`);
    }

    if (!imageUrl) {
      throw new AppError('Banner image is required', 400);
    }

    const createdBy = creatorId ? new Types.ObjectId(creatorId) : undefined;

    return bannerRepository.create({
      ...data,
      imageUrl,
      createdBy,
    });
  }

  async updateBanner(id: string, data: any, file?: { buffer: Buffer; mimetype: string }): Promise<IBanner | null> {
    const banner = await this.getBannerById(id);

    const updateData = { ...data };

    if (file) {
      updateData.imageUrl = await this.uploadBannerImage(file.buffer, `banner_${banner._id.toString()}`);
    }

    const updated = await bannerRepository.updateById(id, updateData);
    if (!updated) throw new AppError('Banner not found', 404);
    return updated;
  }

  async deleteBanner(id: string): Promise<IBanner | null> {
    const banner = await bannerRepository.deleteById(id);
    if (!banner) throw new AppError('Banner not found', 404);
    return banner;
  }
}

export const bannerService = new BannerService();
