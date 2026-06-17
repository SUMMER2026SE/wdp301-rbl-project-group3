import mongoose, { Document, Schema, Types } from 'mongoose';

export type CategoryStatus = 'active' | 'inactive';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
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
