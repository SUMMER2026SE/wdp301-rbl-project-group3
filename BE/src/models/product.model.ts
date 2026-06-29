import mongoose, { Document, Schema, Types } from 'mongoose';

export type ProductStatus = 'active' | 'inactive';

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  sku: string;
  description?: string;
  categoryId?: Types.ObjectId;
  unit: string;
  costPrice: number;
  salePrice: number;
  imageUrl?: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    unit: { type: String, required: true, trim: true, default: 'item' },
    costPrice: { type: Number, required: false, min: 0, default: 0 },
    salePrice: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ProductSchema.index({ sku: 1 });
ProductSchema.index({ name: 'text' });
ProductSchema.index({ status: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
