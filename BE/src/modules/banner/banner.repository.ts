import { IBanner, Banner } from '../../models/banner.model';

export interface BannerFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedBanners {
  items: IBanner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class BannerRepository {
  async create(data: Partial<IBanner>): Promise<IBanner> {
    return new Banner(data).save();
  }

  async findPaginated(
    filters: BannerFilters,
    page: number,
    limit: number
  ): Promise<PaginatedBanners> {
    const query: Record<string, any> = {};

    if (filters.status) query.status = filters.status;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Banner.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Banner.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<IBanner | null> {
    return Banner.findById(id).exec();
  }

  async updateById(id: string, data: Partial<IBanner>): Promise<IBanner | null> {
    return Banner.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<IBanner | null> {
    return Banner.findByIdAndDelete(id).exec();
  }

  async findActiveBanners(): Promise<IBanner[]> {
    return Banner.find({ status: 'active' }).sort({ order: 1, createdAt: -1 }).exec();
  }
}

export const bannerRepository = new BannerRepository();
