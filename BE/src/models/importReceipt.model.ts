import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IImportReceiptItem {
  productId: Types.ObjectId;
  quantity: number;
  unitCost: number;
  subtotal: number;
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
  createdAt: Date;
  updatedAt: Date;
}

const ImportReceiptItemSchema = new Schema<IImportReceiptItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ImportReceiptSchema.index({ code: 1 });
ImportReceiptSchema.index({ branchId: 1, createdAt: -1 });

export const ImportReceipt = mongoose.model<IImportReceipt>('ImportReceipt', ImportReceiptSchema);
