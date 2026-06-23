import { IImportReceipt } from '../../models/importReceipt.model';
import { IInventory } from '../../models/inventory.model';
import { UserRole } from '../../types/common.types';
type ImportItemInput = {
    productId: string;
    quantity: number;
    unitCost: number;
};
type InventoryActor = {
    userId: string;
    role: UserRole;
};
export declare class InventoryService {
    getInventory(filters: {
        branchId?: string;
        productId?: string;
        lowStock?: boolean;
        actor: InventoryActor;
    }): Promise<IInventory[]>;
    createImportReceipt(data: {
        branchId: string;
        supplierName?: string;
        note?: string;
        items: ImportItemInput[];
        createdBy: string;
        actor: InventoryActor;
    }): Promise<IImportReceipt>;
    getImportReceipts(filters: {
        branchId?: string;
        status?: string;
        actor: InventoryActor;
    }): Promise<IImportReceipt[]>;
    getImportReceiptById(id: string, actor: InventoryActor): Promise<IImportReceipt>;
    updateImportReceipt(id: string, data: {
        branchId?: string;
        supplierName?: string;
        note?: string;
        items?: ImportItemInput[];
        updatedBy: string;
        actor: InventoryActor;
    }): Promise<IImportReceipt>;
    cancelImportReceipt(id: string, cancelledBy: string, actor: InventoryActor): Promise<IImportReceipt>;
    private generateReceiptCode;
    private prepareItems;
    private applyImportedStock;
    private reverseReceiptStock;
    private captureInventorySnapshots;
    private restoreInventorySnapshots;
    private throwImportReceiptMutationError;
    private ensureActiveBranch;
    private resolveAccessibleBranch;
    private ensureReceiptStockUnchanged;
}
export declare const inventoryService: InventoryService;
export {};
//# sourceMappingURL=inventory.service.d.ts.map