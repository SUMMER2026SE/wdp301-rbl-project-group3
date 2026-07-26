import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICompetitorProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  sku: string; // SKU from competitor (e.g. Winmart's SKU)
  description?: string;
  brand?: string;
  unit: string;
  price: number; // Competitor's sale price
  imageUrl?: string;
  source: string; // e.g. 'Winmart'
  sourceUrl?: string; // Original URL crawled
  createdAt: Date;
  updatedAt: Date;
  normalizedName?: string;
  normalizedBrand?: string;
  normalizedUnit?: string;
}

const CompetitorProductSchema = new Schema<ICompetitorProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    brand: { type: String, trim: true },
    unit: { type: String, required: true, trim: true, default: 'item' },
    price: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String },
    source: { type: String, required: true, default: 'Winmart', trim: true },
    sourceUrl: { type: String, trim: true },
    normalizedName: { type: String, index: true },
    normalizedBrand: { type: String, index: true },
    normalizedUnit: { type: String, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CompetitorProductSchema.index({ name: 'text' });

export const CompetitorProduct = mongoose.model<ICompetitorProduct>('CompetitorProduct', CompetitorProductSchema);
/**
 * Defines the Mongoose schema, TypeScript contract, and persistence rules for this domain entity.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
