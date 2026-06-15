import { IProduct, Product } from '../../models/product.model';

export class ProductRepository {
  async create(data: Partial<IProduct>): Promise<IProduct> {
    return new Product(data).save();
  }

  async findAll(filters: { status?: string; keyword?: string }): Promise<IProduct[]> {
    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.keyword) {
      query.$or = [
        { name: { $regex: filters.keyword, $options: 'i' } },
        { sku: { $regex: filters.keyword, $options: 'i' } },
      ];
    }

    return Product.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<IProduct | null> {
    return Product.findById(id).exec();
  }

  async findBySku(sku: string): Promise<IProduct | null> {
    return Product.findOne({ sku: sku.toUpperCase() }).exec();
  }
}

export const productRepository = new ProductRepository();
