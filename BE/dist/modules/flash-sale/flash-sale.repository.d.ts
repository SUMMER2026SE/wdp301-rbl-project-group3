import { IFlashSale } from '../../models/flash-sale.model';
export interface FlashSaleFilter {
    status?: 'draft' | 'active' | 'inactive' | 'expired';
    scope?: 'global' | 'branch';
    branchId?: string;
    page?: number;
    limit?: number;
}
export declare class FlashSaleRepository {
    createFlashSale(data: Partial<IFlashSale>): Promise<IFlashSale>;
    findFlashSaleById(id: string): Promise<IFlashSale | null>;
    findFlashSales(filter: FlashSaleFilter): Promise<{
        data: IFlashSale[];
        total: number;
    }>;
    updateFlashSale(id: string, data: Partial<IFlashSale>): Promise<IFlashSale | null>;
    deleteFlashSale(id: string): Promise<IFlashSale | null>;
    /**
     * Finds the currently active flash sale for a branch (or falls back to global).
     */
    findActiveFlashSale(branchId?: string): Promise<IFlashSale | null>;
    /**
     * Increments the sold quantity of a product in a flash sale campaign.
     */
    incrementProductSoldQuantity(flashSaleId: string, productId: string, quantity: number): Promise<void>;
    /**
     * Decrements the sold quantity of a product in a flash sale campaign.
     */
    decrementProductSoldQuantity(flashSaleId: string, productId: string, quantity: number): Promise<void>;
    /**
     * Finds a flash sale campaign matching an order date, branch, and product.
     */
    findFlashSaleByOrderProduct(orderDate: Date, branchId: string, productId: string): Promise<IFlashSale | null>;
}
export declare const flashSaleRepository: FlashSaleRepository;
//# sourceMappingURL=flash-sale.repository.d.ts.map