import { IProduct } from '../../models/product.model';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { productRepository } from './product.repository';

export interface ListProductsQuery {
  page: number;
  limit: number;
  status?: string;
  keyword?: string;
}

export interface ListProductsResult {
  products: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ProductService {
  async listProducts(query: ListProductsQuery): Promise<ListProductsResult> {
    const { items, total, page, limit, totalPages } = await productRepository.findPaginated(
      { status: query.status, keyword: query.keyword },
      query.page,
      query.limit
    );

    return {
      products: items,
      pagination: { page, limit, total, totalPages },
    };
  }

  async createProduct(data: Partial<IProduct>): Promise<IProduct> {
    const existing = await productRepository.findBySku(String(data.sku));
    if (existing) throw new AppError('Product SKU already exists', 409);

    return productRepository.create({
      ...data,
      sku: String(data.sku).toUpperCase(),
      unit: data.unit || 'item',
      salePrice: data.salePrice ?? 0,
    });
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async ensureProductExists(id: string): Promise<IProduct> {
    return this.getProductById(id);
  }
}

export const productService = new ProductService();
