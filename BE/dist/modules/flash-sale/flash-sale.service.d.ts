import { IFlashSale } from '../../models/flash-sale.model';
export interface CallerContext {
    userId: string;
    role: 'customer' | 'admin' | 'branch_manager' | 'staff';
    branchId?: string;
}
export declare class FlashSaleService {
    buildCallerContext(userId: string, role: string): Promise<CallerContext>;
    createFlashSale(caller: CallerContext, data: any): Promise<IFlashSale>;
    listFlashSales(caller: CallerContext, filterParams: any): Promise<{
        data: IFlashSale[];
        total: number;
    }>;
    getFlashSaleById(caller: CallerContext, id: string): Promise<IFlashSale>;
    updateFlashSale(caller: CallerContext, id: string, data: any): Promise<IFlashSale | null>;
    deleteFlashSale(caller: CallerContext, id: string): Promise<void>;
    getActiveFlashSale(branchId?: string): Promise<IFlashSale | null>;
}
export declare const flashSaleService: FlashSaleService;
//# sourceMappingURL=flash-sale.service.d.ts.map