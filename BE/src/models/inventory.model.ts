import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInventory extends Document {
  _id: Types.ObjectId;
  branchId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  averageCost: number;
  lastImportCost?: number;
  lowStockThreshold: number;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    averageCost: { type: Number, required: true, min: 0, default: 0 },
    lastImportCost: { type: Number, min: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 10 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

InventorySchema.index({ branchId: 1, productId: 1 }, { unique: true });
InventorySchema.index({ branchId: 1 });
InventorySchema.index({ productId: 1 });

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);
