import { IProduct } from '../../models/product.model';
export interface ListProductsQuery {
    page: number;
    limit: number;
    status?: string;
    keyword?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    branchId?: string;
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
export declare class ProductService {
    private uploadProductImage;
    listProducts(query: ListProductsQuery): Promise<ListProductsResult>;
    createProduct(data: Partial<IProduct>, file?: ProductFile): Promise<IProduct>;
    getProductById(id: string): Promise<IProduct>;
    updateProduct(id: string, data: Partial<IProduct>, file?: ProductFile): Promise<IProduct>;
    deleteProduct(id: string): Promise<IProduct>;
    ensureProductExists(id: string): Promise<IProduct>;
}
export declare const productService: ProductService;
//# sourceMappingURL=product.service.d.ts.map