import { IProduct } from '../../models/product.model';
export declare class ProductRepository {
    create(data: Partial<IProduct>): Promise<IProduct>;
    findAll(filters: {
        status?: string;
        keyword?: string;
    }): Promise<IProduct[]>;
    findById(id: string): Promise<IProduct | null>;
    findBySku(sku: string): Promise<IProduct | null>;
}
export declare const productRepository: ProductRepository;
//# sourceMappingURL=product.repository.d.ts.map