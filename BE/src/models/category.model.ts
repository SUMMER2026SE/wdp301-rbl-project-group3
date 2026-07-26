import mongoose, { Document, Schema, Types } from 'mongoose';

export type CategoryStatus = 'active' | 'inactive';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  minMargin?: number;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    minMargin: { type: Number, default: 0, min: 0, max: 100 },
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

CategorySchema.index({ code: 1 });
CategorySchema.index({ status: 1 });
CategorySchema.index({ name: 'text' });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
/**
 * Defines the Mongoose schema, TypeScript contract, and persistence rules for this domain entity.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
