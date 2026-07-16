import mongoose, { Document, Schema, Types } from 'mongoose';

export type BannerStatus = 'active' | 'inactive';

export interface IBanner extends Document {
  _id: Types.ObjectId;
  title: string;
  subtitle: string;
  description?: string;
  promoCode?: string;
  imageUrl: string;
  linkUrl?: string;
  status: BannerStatus;
  order: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 500 },
    promoCode: { type: String, trim: true, maxlength: 50 },
    imageUrl: { type: String, required: true, trim: true },
    linkUrl: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
    order: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

BannerSchema.index({ status: 1 });
BannerSchema.index({ order: 1 });

export const Banner = mongoose.model<IBanner>('Banner', BannerSchema);
