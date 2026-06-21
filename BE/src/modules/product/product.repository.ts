import { IProduct, Product } from '../../models/product.model';

export interface ProductListFilters {
  status?: string;
  keyword?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedProducts {
  items: IProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductRepository {
  async create(data: Partial<IProduct>): Promise<IProduct> {
    return new Product(data).save();
  }

  async findPaginated(
    filters: ProductListFilters,
    page: number,
    limit: number
  ): Promise<PaginatedProducts> {
    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.keyword) {
      query.$or = [
        { name: { $regex: filters.keyword, $options: 'i' } },
        { sku: { $regex: filters.keyword, $options: 'i' } },
        { description: { $regex: filters.keyword, $options: 'i' } },
      ];
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const salePriceQuery: Record<string, number> = {};
      const legacyPriceQuery: Record<string, number> = {};
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
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Product.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<IProduct | null> {
    return Product.findById(id).exec();
  }

  async findBySku(sku: string): Promise<IProduct | null> {
    return Product.findOne({ sku: sku.toUpperCase() }).exec();
  }

  async updateById(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}

export const productRepository = new ProductRepository();
