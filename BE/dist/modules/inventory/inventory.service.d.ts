import { IImportReceipt } from '../../models/importReceipt.model';
import { IInventory } from '../../models/inventory.model';
export declare class InventoryService {
    getInventory(filters: {
        branchId?: string;
        productId?: string;
        lowStock?: boolean;
    }): Promise<IInventory[]>;
    createImportReceipt(data: {
        branchId: string;
        supplierName?: string;
        note?: string;
        items: {
            productId: string;
            quantity: number;
            unitCost: number;
        }[];
        createdBy: string;
    }): Promise<IImportReceipt>;
    getImportReceipts(filters: {
        branchId?: string;
    }): Promise<IImportReceipt[]>;
    private generateReceiptCode;
    private restoreInventorySnapshots;
}
export declare const inventoryService: InventoryService;
//# sourceMappingURL=inventory.service.d.ts.map