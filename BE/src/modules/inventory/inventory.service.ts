import { Types } from 'mongoose';
import { branchService } from '../branch/branch.service';
import { productService } from '../product/product.service';
import { inventoryRepository } from './inventory.repository';
import {
  IImportReceipt,
  IImportReceiptItem,
  ImportReceipt,
} from '../../models/importReceipt.model';
import { Inventory, IInventory } from '../../models/inventory.model';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { User } from '../../models/user.model';
import { UserRole } from '../../types/common.types';
import { emitGlobal } from '../../config/socket.config';

type ImportItemInput = {
  productId: string;
  quantity: number;
  unitCost: number;
};

type InventorySnapshot = {
  branchId: string;
  productId: string;
  existed: boolean;
  quantity: number;
  averageCost: number;
  lastImportCost?: number;
  lowStockThreshold: number;
};

type InventoryActor = {
  userId: string;
  role: UserRole;
};

export class InventoryService {
  async getInventory(filters: {
    branchId?: string;
    productId?: string;
    lowStock?: boolean;
    actor: InventoryActor;
  }): Promise<IInventory[]> {
    const branchId = await this.resolveAccessibleBranch(
      filters.actor,
      filters.branchId
    );
    return inventoryRepository.findInventory({
      branchId,
      productId: filters.productId,
      lowStock: filters.lowStock,
    });
  }

  async createImportReceipt(data: {
    branchId: string;
    supplierName?: string;
    note?: string;
    items: ImportItemInput[];
    createdBy: string;
    actor: InventoryActor;
  }): Promise<IImportReceipt> {
    await this.resolveAccessibleBranch(data.actor, data.branchId);
    await this.ensureActiveBranch(data.branchId);

    const items = await this.prepareItems(data.items);
    for (const item of items) {
      item.verified = false;
    }
    const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0);

    return await inventoryRepository.createImportReceipt({
      code: this.generateReceiptCode(),
      branchId: data.branchId,
      supplierName: data.supplierName,
      note: data.note,
      items,
      totalCost,
      createdBy: data.createdBy,
    });
  }

  async getImportReceipts(filters: {
    branchId?: string;
    status?: string;
    actor: InventoryActor;
  }): Promise<IImportReceipt[]> {
    const branchId = await this.resolveAccessibleBranch(
      filters.actor,
      filters.branchId
    );
    return inventoryRepository.findImportReceipts({
      branchId,
      status: filters.status,
    });
  }

  async getImportReceiptById(
    id: string,
    actor: InventoryActor
  ): Promise<IImportReceipt> {
    const rawReceipt = await inventoryRepository.findImportReceiptById(id);
    if (!rawReceipt) throw new AppError('Import receipt not found', 404);
    await this.resolveAccessibleBranch(actor, rawReceipt.branchId.toString());

    const receipt = await inventoryRepository.findImportReceiptDetail(id);
    if (!receipt) throw new AppError('Import receipt not found', 404);
    return receipt;
  }

  async updateImportReceipt(
    id: string,
    data: {
      branchId?: string;
      supplierName?: string;
      note?: string;
      items?: ImportItemInput[];
      updatedBy: string;
      actor: InventoryActor;
    }
  ): Promise<IImportReceipt> {
    const existingReceipt = await inventoryRepository.findImportReceiptById(id);
    if (!existingReceipt) throw new AppError('Import receipt not found', 404);
    await this.resolveAccessibleBranch(
      data.actor,
      existingReceipt.branchId.toString()
    );
    if (data.branchId) {
      await this.resolveAccessibleBranch(data.actor, data.branchId);
    }

    const receipt = await inventoryRepository.acquireImportReceiptForMutation(id);
    if (!receipt) {
      await this.throwImportReceiptMutationError(id);
    }

    const lockedReceipt = receipt!;
    const currentBranchId = lockedReceipt.branchId.toString();
    const nextBranchId = data.branchId || currentBranchId;
    const isVerified = lockedReceipt.verificationStatus === 'verified' || lockedReceipt.verificationStatus === 'partially_verified';

    const nextItemsInput = data.items || lockedReceipt.items.map(it => ({
      productId: it.productId.toString(),
      quantity: it.quantity,
      unitCost: it.unitCost
    }));

    let snapshots = new Map<string, InventorySnapshot>();

    try {
      await this.resolveAccessibleBranch(data.actor, currentBranchId);
      await this.resolveAccessibleBranch(data.actor, nextBranchId);
      const preparedItems = await this.prepareItems(nextItemsInput);

      if (isVerified) {
        await this.ensureReceiptStockUnchanged(lockedReceipt);
        const verifiedItems = lockedReceipt.items.filter(it => it.verifiedQuantity && it.verifiedQuantity > 0);
        snapshots = await this.captureInventorySnapshots(
          verifiedItems.map((item) => ({
            branchId: currentBranchId,
            productId: item.productId.toString(),
          }))
        );

        await this.reverseReceiptStock(
          id,
          currentBranchId,
          lockedReceipt.items,
          data.updatedBy
        );
      }

      for (const item of preparedItems) {
        item.verified = false;
        item.appliedInventoryQuantity = undefined;
        item.appliedAverageCost = undefined;
      }

      const updated = await ImportReceipt.findOneAndUpdate(
        { _id: id, status: 'adjusting' },
        {
          $set: {
            branchId: nextBranchId,
            supplierName: data.supplierName ?? lockedReceipt.supplierName,
            note: data.note ?? lockedReceipt.note,
            items: preparedItems,
            totalCost: preparedItems.reduce((sum, item) => sum + item.subtotal, 0),
            updatedBy: new Types.ObjectId(data.updatedBy),
            status: 'active',
            verificationStatus: 'pending',
          },
          $unset: {
            mutationLockedAt: 1,
            verifiedBy: 1,
            verifiedAt: 1,
            verificationNote: 1,
          },
        },
        { new: true }
      ).exec();

      if (!updated) throw new AppError('Import receipt update conflict', 409);
      return (await inventoryRepository.findImportReceiptDetail(id)) || updated;
    } catch (error) {
      if (snapshots.size > 0) {
        await this.restoreInventorySnapshots(snapshots, data.updatedBy);
      }
      await inventoryRepository.releaseImportReceiptMutation(id);
      throw error;
    }
  }

  async cancelImportReceipt(
    id: string,
    cancelledBy: string,
    actor: InventoryActor
  ): Promise<IImportReceipt> {
    const existingReceipt = await inventoryRepository.findImportReceiptById(id);
    if (!existingReceipt) throw new AppError('Import receipt not found', 404);
    await this.resolveAccessibleBranch(
      actor,
      existingReceipt.branchId.toString()
    );

    const receipt = await inventoryRepository.acquireImportReceiptForMutation(id);
    if (!receipt) {
      await this.throwImportReceiptMutationError(id);
    }

    const lockedReceipt = receipt!;
    const branchId = lockedReceipt.branchId.toString();
    const isVerified = lockedReceipt.verificationStatus === 'verified' || lockedReceipt.verificationStatus === 'partially_verified';
    let snapshots = new Map<string, InventorySnapshot>();

    try {
      await this.resolveAccessibleBranch(actor, branchId);
      
      if (isVerified) {
        await this.ensureReceiptStockUnchanged(lockedReceipt);
        const verifiedItems = lockedReceipt.items.filter(it => it.verifiedQuantity && it.verifiedQuantity > 0);
        snapshots = await this.captureInventorySnapshots(
          verifiedItems.map((item) => ({ branchId, productId: item.productId.toString() }))
        );
        await this.reverseReceiptStock(id, branchId, lockedReceipt.items, cancelledBy);
      }

      const cancelled = await inventoryRepository.cancelImportReceipt(id, cancelledBy);
      if (!cancelled) throw new AppError('Import receipt cancellation conflict', 409);
      return (await inventoryRepository.findImportReceiptDetail(id)) || cancelled;
    } catch (error) {
      if (snapshots.size > 0) {
        await this.restoreInventorySnapshots(snapshots, cancelledBy);
      }
      await inventoryRepository.releaseImportReceiptMutation(id);
      throw error;
    }
  }

  private generateReceiptCode(): string {
    const date = new Date();
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `IR-${stamp}-${random}`;
  }

  private async prepareItems(
    items: ImportItemInput[]
  ): Promise<IImportReceiptItem[]> {
    const preparedItems: IImportReceiptItem[] = [];
    for (const item of items) {
      const product = await productService.ensureProductExists(item.productId);
      if (product.status !== 'active') {
        throw new AppError(
          `Inactive product ${item.productId} cannot be imported`,
          409
        );
      }
      preparedItems.push({
        productId: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.quantity * item.unitCost,
      });
    }
    return preparedItems;
  }

  private async applyImportedStock(
    branchId: string,
    items: ImportItemInput[],
    updatedBy: string
  ): Promise<Map<string, IInventory>> {
    const appliedInventory = new Map<string, IInventory>();
    for (const item of items) {
      const inventory = await inventoryRepository.upsertStock({
        branchId,
        productId: item.productId,
        quantityToAdd: item.quantity,
        unitCost: item.unitCost,
        updatedBy,
      });
      appliedInventory.set(item.productId, inventory);
    }
    return appliedInventory;
  }

  private async reverseReceiptStock(
    receiptId: string,
    branchId: string,
    items: IImportReceiptItem[],
    updatedBy: string
  ): Promise<void> {
    for (const item of items) {
      const quantityToRemove = item.verifiedQuantity || 0;
      if (quantityToRemove <= 0) continue;

      const replacementLastImportCost =
        await inventoryRepository.findLatestActiveImportCost(
          branchId,
          item.productId.toString(),
          receiptId
        );
      const updated = await inventoryRepository.reverseImportedStock({
        branchId,
        productId: item.productId.toString(),
        quantityToRemove,
        unitCost: item.unitCost,
        updatedBy,
        replacementLastImportCost,
      });

      if (!updated) {
        throw new AppError(
          `Cannot reverse imported stock for product ${item.productId.toString()}. The stock may already have been consumed.`,
          409
        );
      }
    }
  }

  private async captureInventorySnapshots(
    locations: { branchId: string; productId: string }[]
  ): Promise<Map<string, InventorySnapshot>> {
    const snapshots = new Map<string, InventorySnapshot>();

    for (const location of locations) {
      const key = `${location.branchId}:${location.productId}`;
      if (snapshots.has(key)) continue;

      const current = await inventoryRepository.findInventoryItem(
        location.branchId,
        location.productId
      );
      snapshots.set(key, {
        branchId: location.branchId,
        productId: location.productId,
        existed: Boolean(current),
        quantity: current?.quantity || 0,
        averageCost: current?.averageCost || 0,
        lastImportCost: current?.lastImportCost,
        lowStockThreshold: current?.lowStockThreshold || 10,
      });
    }

    return snapshots;
  }

  private async restoreInventorySnapshots(
    snapshots: Map<string, InventorySnapshot>,
    updatedBy: string
  ): Promise<void> {
    for (const snapshot of snapshots.values()) {
      if (!snapshot.existed) {
        await inventoryRepository.deleteInventoryItem(
          snapshot.branchId,
          snapshot.productId
        );
        continue;
      }

      await inventoryRepository.restoreInventoryItem({
        branchId: snapshot.branchId,
        productId: snapshot.productId,
        quantity: snapshot.quantity,
        averageCost: snapshot.averageCost,
        lastImportCost: snapshot.lastImportCost,
        lowStockThreshold: snapshot.lowStockThreshold,
        updatedBy,
      });
    }
  }

  private async throwImportReceiptMutationError(id: string): Promise<never> {
    const existing = await inventoryRepository.findImportReceiptById(id);
    if (!existing) throw new AppError('Import receipt not found', 404);
    if (existing.status === 'cancelled') {
      throw new AppError('Cancelled import receipts cannot be modified', 409);
    }
    throw new AppError('Import receipt is being modified by another request', 409);
  }

  private async ensureActiveBranch(branchId: string): Promise<void> {
    const branch = await branchService.getBranchById(branchId);
    if (branch.status !== 'active') {
      throw new AppError('Cannot import stock into an inactive branch', 409);
    }
  }

  private async resolveAccessibleBranch(
    actor: InventoryActor,
    requestedBranchId?: string
  ): Promise<string | undefined> {
    if (actor.role === 'admin') return requestedBranchId;

    const user = await User.findById(actor.userId)
      .select('branchId status')
      .lean()
      .exec();

    if (!user || user.status !== 'active') {
      throw new AppError('Active staff account required', 403);
    }

    if (!user.branchId) {
      throw new AppError('No branch is assigned to this account', 403);
    }

    const assignedBranchId = user.branchId.toString();
    if (requestedBranchId && requestedBranchId !== assignedBranchId) {
      throw new AppError('You cannot access another branch', 403);
    }

    return assignedBranchId;
  }

  private async ensureReceiptStockUnchanged(receipt: IImportReceipt): Promise<void> {
    const branchId = receipt.branchId.toString();

    for (const item of receipt.items) {
      if (!item.verifiedQuantity || item.verifiedQuantity <= 0) continue;

      if (
        item.appliedInventoryQuantity === undefined ||
        item.appliedAverageCost === undefined
      ) {
        throw new AppError(
          'This legacy import receipt cannot safely change stock because no inventory checkpoint is available',
          409
        );
      }

      const inventory = await inventoryRepository.findInventoryItem(
        branchId,
        item.productId.toString()
      );
      const averageCostMatches =
        inventory &&
        Math.abs(inventory.averageCost - item.appliedAverageCost) < 0.000001;

      if (
        !inventory ||
        inventory.quantity !== item.appliedInventoryQuantity ||
        !averageCostMatches
      ) {
        throw new AppError(
          `Import receipt cannot be modified because inventory for product ${item.productId.toString()} has changed`,
          409
        );
      }
    }
  }

  async createInventory(data: {
    branchId: string;
    productId: string;
    quantity: number;
    averageCost: number;
    lowStockThreshold: number;
    createdBy: string;
    actor: InventoryActor;
  }): Promise<IInventory> {
    await this.resolveAccessibleBranch(data.actor, data.branchId);
    await this.ensureActiveBranch(data.branchId);

    // Verify if product exists and is active
    const product = await productService.ensureProductExists(data.productId);
    if (product.status !== 'active') {
      throw new AppError('Cannot add an inactive product to inventory', 409);
    }

    // Verify that inventory record does not exist yet
    const existing = await Inventory.findOne({ branchId: data.branchId, productId: data.productId }).exec();
    if (existing) {
      throw new AppError('Product already exists in this branch\'s inventory', 409);
    }

    const result = await new Inventory({
      branchId: data.branchId,
      productId: data.productId,
      quantity: data.quantity,
      averageCost: data.averageCost,
      lastImportCost: data.averageCost > 0 ? data.averageCost : undefined,
      lowStockThreshold: data.lowStockThreshold,
      updatedBy: new Types.ObjectId(data.createdBy),
    }).save();

    emitGlobal('inventory:updated', {
      branchId: data.branchId,
      productId: data.productId,
      quantity: data.quantity,
    });

    return result;
  }

  async updateInventory(
    id: string,
    data: {
      quantity?: number;
      averageCost?: number;
      lowStockThreshold?: number;
      updatedBy: string;
      actor: InventoryActor;
    }
  ): Promise<IInventory> {
    const existing = await Inventory.findById(id).exec();
    if (!existing) {
      throw new AppError('Inventory record not found', 404);
    }

    await this.resolveAccessibleBranch(data.actor, existing.branchId.toString());

    if (data.quantity !== undefined) existing.quantity = data.quantity;
    if (data.averageCost !== undefined) existing.averageCost = data.averageCost;
    if (data.lowStockThreshold !== undefined) existing.lowStockThreshold = data.lowStockThreshold;
    existing.updatedBy = new Types.ObjectId(data.updatedBy);

    const result = await existing.save();

    emitGlobal('inventory:updated', {
      branchId: result.branchId.toString(),
      productId: result.productId.toString(),
      quantity: result.quantity,
    });

    return result;
  }

  async deleteInventory(
    id: string,
    actor: InventoryActor
  ): Promise<void> {
    const existing = await Inventory.findById(id).exec();
    if (!existing) {
      throw new AppError('Inventory record not found', 404);
    }

    await this.resolveAccessibleBranch(actor, existing.branchId.toString());

    await Inventory.deleteOne({ _id: id }).exec();

    emitGlobal('inventory:updated', {
      branchId: existing.branchId.toString(),
      productId: existing.productId.toString(),
      quantity: 0,
    });
  }

  async verifyImportReceipt(
    id: string,
    data: {
      verifiedItems: { productId: string; verifiedQuantity: number }[];
      note?: string;
      verifiedBy: string;
      actor: InventoryActor;
    }
  ): Promise<IImportReceipt> {
    const receipt = await inventoryRepository.findImportReceiptById(id);
    if (!receipt) throw new AppError('Import receipt not found', 404);

    await this.resolveAccessibleBranch(data.actor, receipt.branchId.toString());

    if (receipt.verificationStatus && receipt.verificationStatus !== 'pending') {
      throw new AppError('This import receipt has already been verified', 400);
    }

    if (receipt.status === 'cancelled') {
      throw new AppError('Cannot verify a cancelled import receipt', 400);
    }

    const branchId = receipt.branchId.toString();
    const updatedItems = [];

    for (const item of receipt.items) {
      const match = data.verifiedItems.find(
        (vi) => vi.productId === item.productId.toString()
      );
      const rawVQty = match ? match.verifiedQuantity : 0;
      const verifiedQuantity = Math.max(0, Math.min(item.quantity, rawVQty));
      const verified = verifiedQuantity === item.quantity;

      let appliedQty = item.appliedInventoryQuantity;
      let appliedAvgCost = item.appliedAverageCost;

      if (verifiedQuantity > 0) {
        const inventory = await inventoryRepository.upsertStock({
          branchId,
          productId: item.productId.toString(),
          quantityToAdd: verifiedQuantity,
          unitCost: item.unitCost,
          updatedBy: data.verifiedBy,
        });
        appliedQty = inventory.quantity;
        appliedAvgCost = inventory.averageCost;
      }

      updatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.subtotal,
        appliedInventoryQuantity: appliedQty,
        appliedAverageCost: appliedAvgCost,
        verified,
        verifiedQuantity,
      });
    }

    const allVerified = updatedItems.every((item) => item.verified);
    const verificationStatus = allVerified ? 'verified' : 'partially_verified';

    const result = await inventoryRepository.saveImportReceiptVerification(id, {
      items: updatedItems as any,
      verificationStatus,
      verifiedBy: data.verifiedBy,
      verifiedAt: new Date(),
      verificationNote: data.note,
    });

    if (!result) throw new AppError('Failed to verify import receipt', 500);

    const detailed = await inventoryRepository.findImportReceiptDetail(id);
    if (!detailed) throw new AppError('Import receipt detail not found', 500);

    // Phát tin cập nhật tồn kho realtime
    for (const item of updatedItems) {
      emitGlobal('inventory:updated', {
        branchId,
        productId: item.productId.toString(),
        quantity: item.appliedInventoryQuantity || 0,
      });
    }

    return detailed;
  }
}

export const inventoryService = new InventoryService();
