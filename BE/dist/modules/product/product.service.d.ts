import { IProduct } from '../../models/product.model';
export declare class ProductService {
    createProduct(data: Partial<IProduct>): Promise<IProduct>;
    getProducts(filters: {
        status?: string;
        keyword?: string;
    }): Promise<IProduct[]>;
    ensureProductExists(id: string): Promise<IProduct>;
}
export declare const productService: ProductService;
//# sourceMappingURL=product.service.d.ts.map