import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProductStatus = 'active' | 'inactive';

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  sku: string;
  description?: string;
  categoryId?: Types.ObjectId;
  brand?: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  suggestedPrice?: number;
  imageUrl?: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  normalizedName?: string;
  normalizedBrand?: string;
  normalizedUnit?: string;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: String, trim: true },
    unit: { type: String, required: true, trim: true, default: 'item' },
    costPrice: { type: Number, required: false, min: 0, default: 0 },
    salePrice: { type: Number, required: false, min: 0, default: 0 },
    suggestedPrice: { type: Number, default: 0 },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    normalizedName: { type: String, index: true },
    normalizedBrand: { type: String, index: true },
    normalizedUnit: { type: String, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ProductSchema.index({ name: 'text' });
ProductSchema.index({ status: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
