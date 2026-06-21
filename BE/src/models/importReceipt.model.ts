import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IImportReceiptItem {
  productId: Types.ObjectId;
  quantity: number;
  unitCost: number;
  subtotal: number;
  appliedInventoryQuantity?: number;
  appliedAverageCost?: number;
}

export interface IImportReceipt extends Document {
  _id: Types.ObjectId;
  code: string;
  branchId: Types.ObjectId;
  supplierName?: string;
  note?: string;
  items: IImportReceiptItem[];
  totalCost: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  status: 'active' | 'adjusting' | 'cancelled';
  mutationLockedAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ImportReceiptItemSchema = new Schema<IImportReceiptItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    appliedInventoryQuantity: { type: Number, min: 0 },
    appliedAverageCost: { type: Number, min: 0 },
  },
  { _id: false }
);

const ImportReceiptSchema = new Schema<IImportReceipt>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    supplierName: { type: String, trim: true },
    note: { type: String, trim: true },
    items: { type: [ImportReceiptItemSchema], required: true },
    totalCost: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['active', 'adjusting', 'cancelled'],
      default: 'active',
    },
    mutationLockedAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ImportReceiptSchema.index({ code: 1 });
ImportReceiptSchema.index({ branchId: 1, createdAt: -1 });
ImportReceiptSchema.index({ status: 1 });

export const ImportReceipt = mongoose.model<IImportReceipt>('ImportReceipt', ImportReceiptSchema);
