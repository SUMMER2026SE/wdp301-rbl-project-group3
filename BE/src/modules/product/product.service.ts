import { IProduct } from '../../models/product.model';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { cloudinary } from '../../config/cloudinary.config';
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

export interface ProductFile {
  buffer: Buffer;
  mimetype: string;
}

export class ProductService {
  private uploadProductImage(buffer: Buffer, publicId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'minimart/products',
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
          transformation: [{ width: 800, height: 800, crop: 'limit' }],
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

  async createProduct(data: Partial<IProduct>, file?: ProductFile): Promise<IProduct> {
    const sku = String(data.sku).toUpperCase();
    const existing = await productRepository.findBySku(sku);
    if (existing) throw new AppError('Product SKU already exists', 409);

    let imageUrl: string | undefined;
    if (file) {
      imageUrl = await this.uploadProductImage(file.buffer, `sku_${sku}`);
    }

    return productRepository.create({
      ...data,
      sku,
      unit: data.unit || 'item',
      salePrice: data.salePrice ?? 0,
      imageUrl,
    });
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async updateProduct(
    id: string,
    data: Partial<IProduct>,
    file?: ProductFile
  ): Promise<IProduct> {
    await this.getProductById(id);

    const updateData: Partial<IProduct> = { ...data };

    if (updateData.sku) {
      const sku = String(updateData.sku).toUpperCase();
      const existing = await productRepository.findBySku(sku);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Product SKU already exists', 409);
      }
      updateData.sku = sku;
    }

    if (file) {
      updateData.imageUrl = await this.uploadProductImage(file.buffer, `id_${id}`);
    }

    const hasUpdate = Object.values(updateData).some((value) => value !== undefined);
    if (!hasUpdate) {
      throw new AppError('No valid fields provided to update', 400);
    }

    const updated = await productRepository.updateById(id, updateData);
    if (!updated) throw new AppError('Product not found', 404);
    return updated;
  }

  async deleteProduct(id: string): Promise<IProduct> {
    const updated = await productRepository.updateById(id, { status: 'inactive' });
    if (!updated) throw new AppError('Product not found', 404);
    return updated;
  }

  async ensureProductExists(id: string): Promise<IProduct> {
    return this.getProductById(id);
  }
}

export const productService = new ProductService();
