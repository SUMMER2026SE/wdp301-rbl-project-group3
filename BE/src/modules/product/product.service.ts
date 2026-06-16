import { IProduct } from '../../models/product.model';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { productRepository } from './product.repository';

export class ProductService {
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

  async getProducts(filters: { status?: string; keyword?: string }): Promise<IProduct[]> {
    return productRepository.findAll(filters);
  }

  async ensureProductExists(id: string): Promise<IProduct> {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }
}

export const productService = new ProductService();
