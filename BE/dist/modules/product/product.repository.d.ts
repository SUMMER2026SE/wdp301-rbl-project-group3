import { IProduct } from '../../models/product.model';
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
export declare class ProductRepository {
    create(data: Partial<IProduct>): Promise<IProduct>;
    findPaginated(filters: ProductListFilters, page: number, limit: number): Promise<PaginatedProducts>;
    findById(id: string): Promise<IProduct | null>;
    findBySku(sku: string): Promise<IProduct | null>;
    updateById(id: string, data: Partial<IProduct>): Promise<IProduct | null>;
}
export declare const productRepository: ProductRepository;
//# sourceMappingURL=product.repository.d.ts.map