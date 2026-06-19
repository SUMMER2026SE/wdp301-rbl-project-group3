import { Types } from 'mongoose';
import { branchService } from '../branch/branch.service';
import { productService } from '../product/product.service';
import { inventoryRepository } from './inventory.repository';
import { IImportReceipt } from '../../models/importReceipt.model';
import { IInventory } from '../../models/inventory.model';

export class InventoryService {
  async getInventory(filters: {
    branchId?: string;
    productId?: string;
    lowStock?: boolean;
  }): Promise<IInventory[]> {
    return inventoryRepository.findInventory(filters);
  }

  async createImportReceipt(data: {
    branchId: string;
    supplierName?: string;
    note?: string;
    items: { productId: string; quantity: number; unitCost: number }[];
    createdBy: string;
  }): Promise<IImportReceipt> {
    await branchService.getBranchById(data.branchId);

    const items = [];
    const inventorySnapshots = new Map<
      string,
      {
        existed: boolean;
        quantity: number;
        averageCost: number;
        lastImportCost?: number;
        lowStockThreshold: number;
      }
    >();

    for (const item of data.items) {
      await productService.ensureProductExists(item.productId);
      items.push({
        productId: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.quantity * item.unitCost,
      });
    }

    const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0);

    try {
      for (const item of data.items) {
        if (!inventorySnapshots.has(item.productId)) {
          const current = await inventoryRepository.findInventoryItem(data.branchId, item.productId);
          inventorySnapshots.set(
            item.productId,
            current
              ? {
                  existed: true,
                  quantity: current.quantity,
                  averageCost: current.averageCost,
                  lastImportCost: current.lastImportCost,
                  lowStockThreshold: current.lowStockThreshold,
                }
              : {
                  existed: false,
                  quantity: 0,
                  averageCost: 0,
                  lowStockThreshold: 10,
                }
          );
        }

        await inventoryRepository.upsertStock({
          branchId: data.branchId,
          productId: item.productId,
          quantityToAdd: item.quantity,
          unitCost: item.unitCost,
          updatedBy: data.createdBy,
        });
      }

      return await inventoryRepository.createImportReceipt({
        code: this.generateReceiptCode(),
        branchId: data.branchId,
        supplierName: data.supplierName,
        note: data.note,
        items,
        totalCost,
        createdBy: data.createdBy,
      });
    } catch (error) {
      await this.restoreInventorySnapshots(data.branchId, inventorySnapshots, data.createdBy);
      throw error;
    }
  }

  async getImportReceipts(filters: { branchId?: string }): Promise<IImportReceipt[]> {
    return inventoryRepository.findImportReceipts(filters);
  }

  private generateReceiptCode(): string {
    const date = new Date();
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `IR-${stamp}-${random}`;
  }

  private async restoreInventorySnapshots(
    branchId: string,
    snapshots: Map<
      string,
      {
        existed: boolean;
        quantity: number;
        averageCost: number;
        lastImportCost?: number;
        lowStockThreshold: number;
      }
    >,
    updatedBy: string
  ): Promise<void> {
    for (const [productId, snapshot] of snapshots.entries()) {
      if (!snapshot.existed) {
        await inventoryRepository.deleteInventoryItem(branchId, productId);
        continue;
      }

      await inventoryRepository.restoreInventoryItem({
        branchId,
        productId,
        quantity: snapshot.quantity,
        averageCost: snapshot.averageCost,
        lastImportCost: snapshot.lastImportCost,
        lowStockThreshold: snapshot.lowStockThreshold,
        updatedBy,
      });
    }
  }
}

export const inventoryService = new InventoryService();
