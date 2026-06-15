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

  async findImportReceipts(filters: { branchId?: string }): Promise<IImportReceipt[]> {
    const query: Record<string, unknown> = {};
    if (filters.branchId) query.branchId = filters.branchId;

    return ImportReceipt.find(query)
      .populate('branchId', 'name code')
      .populate('createdBy', 'fullName email')
      .populate('items.productId', 'name sku unit')
      .sort({ createdAt: -1 })
      .exec();
  }
}

export const inventoryRepository = new InventoryRepository();
