import { IProduct } from '../../models/product.model';
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
}

export const productService = new ProductService();
