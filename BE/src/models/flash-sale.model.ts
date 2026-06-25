import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFlashSaleProduct {
  productId: Types.ObjectId;
  flashSalePrice: number;
  limitQuantity: number;
  soldQuantity: number;
}

export interface IFlashSale extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  scope: 'global' | 'branch';
  branchId?: Types.ObjectId;
  products: IFlashSaleProduct[];
  status: 'draft' | 'active' | 'inactive' | 'expired';
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FlashSaleProductSchema = new Schema<IFlashSaleProduct>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  flashSalePrice: { type: Number, required: true, min: 0 },
  limitQuantity: { type: Number, required: true, min: 1 },
  soldQuantity: { type: Number, default: 0, min: 0 },
}, { _id: false });

const FlashSaleSchema = new Schema<IFlashSale>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    scope: {
      type: String,
      enum: ['global', 'branch'],
      required: true,
    },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'expired'],
      default: 'draft',
    },
    products: { type: [FlashSaleProductSchema], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for fast querying of active flash sales
FlashSaleSchema.index({ status: 1, startDate: 1, endDate: 1 });
FlashSaleSchema.index({ branchId: 1, status: 1 });
FlashSaleSchema.index({ scope: 1, status: 1 });

export const FlashSale = mongoose.model<IFlashSale>('FlashSale', FlashSaleSchema);
