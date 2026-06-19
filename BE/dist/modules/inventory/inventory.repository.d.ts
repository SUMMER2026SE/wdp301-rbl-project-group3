import { IInventory } from '../../models/inventory.model';
import { IImportReceipt, IImportReceiptItem } from '../../models/importReceipt.model';
export declare class InventoryRepository {
    findInventory(filters: {
        branchId?: string;
        productId?: string;
        lowStock?: boolean;
    }): Promise<IInventory[]>;
    findInventoryItem(branchId: string, productId: string): Promise<IInventory | null>;
    deleteInventoryItem(branchId: string, productId: string): Promise<void>;
    restoreInventoryItem(data: {
        branchId: string;
        productId: string;
        quantity: number;
        averageCost: number;
        lastImportCost?: number;
        lowStockThreshold: number;
        updatedBy?: string;
    }): Promise<IInventory>;
    decreaseStock(params: {
        branchId: string;
        productId: string;
        quantity: number;
        updatedBy: string;
    }): Promise<IInventory | null>;
    increaseStock(params: {
        branchId: string;
        productId: string;
        quantity: number;
        updatedBy: string;
    }): Promise<IInventory | null>;
    upsertStock(params: {
        branchId: string;
        productId: string;
        quantityToAdd: number;
        unitCost: number;
        updatedBy: string;
    }): Promise<IInventory>;
    createImportReceipt(data: {
        code: string;
        branchId: string;
        supplierName?: string;
        note?: string;
        items: IImportReceiptItem[];
        totalCost: number;
        createdBy: string;
    }): Promise<IImportReceipt>;
    findImportReceipts(filters: {
        branchId?: string;
    }): Promise<IImportReceipt[]>;
}
export declare const inventoryRepository: InventoryRepository;
//# sourceMappingURL=inventory.repository.d.ts.map