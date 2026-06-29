import { Types } from 'mongoose';
import { Inventory, IInventory } from '../../models/inventory.model';
import { ImportReceipt, IImportReceipt, IImportReceiptItem } from '../../models/importReceipt.model';

export class InventoryRepository {
  async findInventory(filters: { branchId?: string; productId?: string; lowStock?: boolean }): Promise<IInventory[]> {
    const query: Record<string, unknown> = {};

    if (filters.branchId) query.branchId = filters.branchId;
    if (filters.productId) query.productId = filters.productId;
    if (filters.lowStock) query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };

    return Inventory.find(query)
      .populate('branchId', 'name code address')
      .populate('productId', 'name sku unit salePrice imageUrl')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findInventoryItem(branchId: string, productId: string): Promise<IInventory | null> {
    return Inventory.findOne({ branchId, productId }).exec();
  }

  async deleteInventoryItem(branchId: string, productId: string): Promise<void> {
    await Inventory.deleteOne({ branchId, productId }).exec();
  }

  async restoreInventoryItem(data: {
    branchId: string;
    productId: string;
    quantity: number;
    averageCost: number;
    lastImportCost?: number;
    lowStockThreshold: number;
    updatedBy?: string;
  }): Promise<IInventory> {
    return Inventory.findOneAndUpdate(
      {
        branchId: data.branchId,
        productId: data.productId,
      },
      {
        quantity: data.quantity,
        averageCost: data.averageCost,
        lastImportCost: data.lastImportCost,
        lowStockThreshold: data.lowStockThreshold,
        updatedBy: data.updatedBy ? new Types.ObjectId(data.updatedBy) : undefined,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec() as Promise<IInventory>;
  }

  async decreaseStock(params: {
    branchId: string;
    productId: string;
    quantity: number;
    updatedBy: string;
  }): Promise<IInventory | null> {
    return Inventory.findOneAndUpdate(
      {
        branchId: params.branchId,
        productId: params.productId,
        quantity: { $gte: params.quantity },
      },
      {
        $inc: { quantity: -params.quantity },
        $set: { updatedBy: new Types.ObjectId(params.updatedBy) },
      },
      { new: true }
    ).exec();
  }

  async increaseStock(params: {
    branchId: string;
    productId: string;
    quantity: number;
    updatedBy: string;
  }): Promise<IInventory | null> {
    return Inventory.findOneAndUpdate(
      {
        branchId: params.branchId,
        productId: params.productId,
      },
      {
        $inc: { quantity: params.quantity },
        $set: { updatedBy: new Types.ObjectId(params.updatedBy) },
      },
      { new: true }
    ).exec();
  }

  async applyOrderStockDeduction(params: {
    orderId: string;
    branchId: string;
    productId: string;
    quantity: number;
    updatedBy: string;
  }): Promise<{ inventory: IInventory | null; applied: boolean }> {
    const orderObjectId = new Types.ObjectId(params.orderId);
    const inventory = await Inventory.findOneAndUpdate(
      {
        branchId: params.branchId,
        productId: params.productId,
        quantity: { $gte: params.quantity },
        deductedOrderIds: { $ne: orderObjectId },
      },
      {
        $inc: { quantity: -params.quantity },
        $addToSet: { deductedOrderIds: orderObjectId },
        $pull: { restoredOrderIds: orderObjectId },
        $set: { updatedBy: new Types.ObjectId(params.updatedBy) },
      },
      { new: true }
    )
      .select('+deductedOrderIds +restoredOrderIds')
      .exec();
    if (inventory) return { inventory, applied: true };

    const existing = await Inventory.findOne({
      branchId: params.branchId,
      productId: params.productId,
    })
      .select('+deductedOrderIds +restoredOrderIds')
      .exec();
    if (!existing) return { inventory: null, applied: false };

    const alreadyDeducted = existing.deductedOrderIds.some(
      (id) => id.toString() === params.orderId
    );
    return {
      inventory: alreadyDeducted ? existing : null,
      applied: false,
    };
  }

  async restoreOrderStockDeduction(params: {
    orderId: string;
    branchId: string;
    productId: string;
    quantity: number;
    updatedBy: string;
    allowLegacy: boolean;
  }): Promise<{ inventory: IInventory | null; restored: boolean }> {
    const orderObjectId = new Types.ObjectId(params.orderId);
    const restored = await Inventory.findOneAndUpdate(
      {
        branchId: params.branchId,
        productId: params.productId,
        deductedOrderIds: orderObjectId,
      },
      {
        $inc: { quantity: params.quantity },
        $pull: { deductedOrderIds: orderObjectId },
        $addToSet: { restoredOrderIds: orderObjectId },
        $set: { updatedBy: new Types.ObjectId(params.updatedBy) },
      },
      { new: true }
    )
      .select('+deductedOrderIds +restoredOrderIds')
      .exec();
    if (restored) return { inventory: restored, restored: true };

    const existing = await Inventory.findOne({
      branchId: params.branchId,
      productId: params.productId,
    })
      .select('+deductedOrderIds +restoredOrderIds')
      .exec();
    if (!existing) return { inventory: null, restored: false };

    const alreadyRestored = existing.restoredOrderIds.some(
      (id) => id.toString() === params.orderId
    );
    if (alreadyRestored || !params.allowLegacy) {
      return { inventory: existing, restored: false };
    }

    const legacyRestored = await Inventory.findOneAndUpdate(
      {
        branchId: params.branchId,
        productId: params.productId,
        deductedOrderIds: { $ne: orderObjectId },
        restoredOrderIds: { $ne: orderObjectId },
      },
      {
        $inc: { quantity: params.quantity },
        $addToSet: { restoredOrderIds: orderObjectId },
        $set: { updatedBy: new Types.ObjectId(params.updatedBy) },
      },
      { new: true }
    )
      .select('+deductedOrderIds +restoredOrderIds')
      .exec();
    return {
      inventory: legacyRestored || existing,
      restored: Boolean(legacyRestored),
    };
  }

  async applyReturnStock(params: {
    returnId: string;
    branchId: string;
    productId: string;
    quantity: number;
    updatedBy: string;
  }): Promise<{ inventory: IInventory | null; applied: boolean }> {
    const returnObjectId = new Types.ObjectId(params.returnId);
    const inventory = await Inventory.findOneAndUpdate(
      {
        branchId: params.branchId,
        productId: params.productId,
        appliedReturnIds: { $ne: returnObjectId },
      },
      {
        $inc: { quantity: params.quantity },
        $addToSet: { appliedReturnIds: returnObjectId },
        $set: { updatedBy: new Types.ObjectId(params.updatedBy) },
      },
      { new: true }
    )
      .select('+appliedReturnIds')
      .exec();

    if (inventory) return { inventory, applied: true };

    const existing = await Inventory.findOne({
      branchId: params.branchId,
      productId: params.productId,
    })
      .select('+appliedReturnIds')
      .exec();
    if (!existing) return { inventory: null, applied: false };

    const alreadyApplied = existing.appliedReturnIds.some(
      (id) => id.toString() === params.returnId
    );
    return {
      inventory: alreadyApplied ? existing : null,
      applied: false,
    };
  }

  async rollbackReturnStock(params: {
    returnId: string;
    branchId: string;
    productId: string;
    quantity: number;
    updatedBy: string;
  }): Promise<boolean> {
    const result = await Inventory.updateOne(
      {
        branchId: params.branchId,
        productId: params.productId,
        quantity: { $gte: params.quantity },
        appliedReturnIds: new Types.ObjectId(params.returnId),
      },
      {
        $inc: { quantity: -params.quantity },
        $pull: { appliedReturnIds: new Types.ObjectId(params.returnId) },
        $set: { updatedBy: new Types.ObjectId(params.updatedBy) },
      }
    ).exec();
    return result.modifiedCount === 1;
  }

  async upsertStock(params: {
    branchId: string;
    productId: string;
    quantityToAdd: number;
    unitCost: number;
    updatedBy: string;
  }): Promise<IInventory> {
    const existing = await Inventory.findOne({
      branchId: params.branchId,
      productId: params.productId,
    }).exec();

    if (!existing) {
      return new Inventory({
        branchId: params.branchId,
        productId: params.productId,
        quantity: params.quantityToAdd,
        averageCost: params.unitCost,
        lastImportCost: params.unitCost,
        updatedBy: params.updatedBy,
      }).save();
    }

    const currentValue = existing.quantity * existing.averageCost;
    const importedValue = params.quantityToAdd * params.unitCost;
    const newQuantity = existing.quantity + params.quantityToAdd;

    existing.quantity = newQuantity;
    existing.averageCost = newQuantity > 0 ? (currentValue + importedValue) / newQuantity : 0;
    existing.lastImportCost = params.unitCost;
    existing.updatedBy = new Types.ObjectId(params.updatedBy);

    return existing.save();
  }

  async reverseImportedStock(params: {
    branchId: string;
    productId: string;
    quantityToRemove: number;
    unitCost: number;
    updatedBy: string;
    replacementLastImportCost?: number;
  }): Promise<IInventory | null> {
    const inventory = await Inventory.findOne({
      branchId: params.branchId,
      productId: params.productId,
    }).exec();

    if (!inventory || inventory.quantity < params.quantityToRemove) {
      return null;
    }

    const remainingQuantity = inventory.quantity - params.quantityToRemove;
    const remainingValue =
      inventory.quantity * inventory.averageCost -
      params.quantityToRemove * params.unitCost;

    if (remainingValue < -0.01) {
      return null;
    }

    inventory.quantity = remainingQuantity;
    inventory.averageCost =
      remainingQuantity > 0 ? Math.max(0, remainingValue) / remainingQuantity : 0;
    inventory.lastImportCost = params.replacementLastImportCost;
    inventory.updatedBy = new Types.ObjectId(params.updatedBy);

    return inventory.save();
  }

  async createImportReceipt(data: {
    code: string;
    branchId: string;
    supplierName?: string;
    note?: string;
    items: IImportReceiptItem[];
    totalCost: number;
    createdBy: string;
  }): Promise<IImportReceipt> {
    return new ImportReceipt(data).save();
  }

  async findImportReceipts(filters: {
    branchId?: string;
    status?: string;
  }): Promise<IImportReceipt[]> {
    const query: Record<string, unknown> = {};
    if (filters.branchId) query.branchId = filters.branchId;
    if (filters.status === 'active') query.status = { $nin: ['adjusting', 'cancelled'] };
    if (filters.status === 'cancelled') query.status = 'cancelled';
    if (!filters.status) query.status = { $ne: 'adjusting' };

    return ImportReceipt.find(query)
      .populate('branchId', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .populate('cancelledBy', 'fullName email')
      .populate('items.productId', 'name sku unit')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findImportReceiptById(id: string): Promise<IImportReceipt | null> {
    return ImportReceipt.findById(id).exec();
  }

  async acquireImportReceiptForMutation(id: string): Promise<IImportReceipt | null> {
    const staleLockThreshold = new Date(Date.now() - 5 * 60 * 1000);
    return ImportReceipt.findOneAndUpdate(
      {
        _id: id,
        status: { $ne: 'cancelled' },
        $or: [
          { status: { $ne: 'adjusting' } },
          { mutationLockedAt: { $lt: staleLockThreshold } },
          { mutationLockedAt: { $exists: false } },
        ],
      },
      {
        $set: {
          status: 'adjusting',
          mutationLockedAt: new Date(),
        },
      },
      { new: true }
    ).exec();
  }

  async releaseImportReceiptMutation(id: string): Promise<void> {
    await ImportReceipt.findOneAndUpdate(
      { _id: id, status: 'adjusting' },
      {
        $set: { status: 'active' },
        $unset: { mutationLockedAt: 1 },
      }
    ).exec();
  }

  async findImportReceiptDetail(id: string): Promise<IImportReceipt | null> {
    return ImportReceipt.findById(id)
      .populate('branchId', 'name code address')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .populate('cancelledBy', 'fullName email')
      .populate('items.productId', 'name sku unit salePrice imageUrl')
      .exec();
  }

  async updateImportReceipt(
    id: string,
    data: {
      branchId: string;
      supplierName?: string;
      note?: string;
      items: IImportReceiptItem[];
      totalCost: number;
      updatedBy: string;
    }
  ): Promise<IImportReceipt | null> {
    return ImportReceipt.findOneAndUpdate(
      { _id: id, status: 'adjusting' },
      {
        $set: {
          ...data,
          status: 'active',
        },
        $unset: { mutationLockedAt: 1 },
      },
      { new: true }
    ).exec();
  }

  async cancelImportReceipt(
    id: string,
    cancelledBy: string
  ): Promise<IImportReceipt | null> {
    return ImportReceipt.findOneAndUpdate(
      { _id: id, status: 'adjusting' },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: new Types.ObjectId(cancelledBy),
          cancelledAt: new Date(),
          updatedBy: new Types.ObjectId(cancelledBy),
        },
        $unset: { mutationLockedAt: 1 },
      },
      { new: true }
    ).exec();
  }

  async findLatestActiveImportCost(
    branchId: string,
    productId: string,
    excludeReceiptId?: string
  ): Promise<number | undefined> {
    const query: Record<string, unknown> = {
      branchId,
      status: { $ne: 'cancelled' },
      'items.productId': productId,
    };

    if (excludeReceiptId) query._id = { $ne: excludeReceiptId };

    const receipt = await ImportReceipt.findOne(query)
      .sort({ createdAt: -1 })
      .select('items')
      .lean()
      .exec();

    const item = receipt?.items.find(
      (entry) => entry.productId.toString() === productId
    );
    return item?.unitCost;
  }
}

export const inventoryRepository = new InventoryRepository();
