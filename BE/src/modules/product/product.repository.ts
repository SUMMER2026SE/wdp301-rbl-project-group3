import { IProduct, Product } from '../../models/product.model';

export interface ProductListFilters {
  status?: string;
  keyword?: string;
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
    if (filters.keyword) {
      query.$or = [
        { name: { $regex: filters.keyword, $options: 'i' } },
        { sku: { $regex: filters.keyword, $options: 'i' } },
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
