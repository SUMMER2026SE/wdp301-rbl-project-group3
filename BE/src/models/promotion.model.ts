import mongoose, { Document, Schema, Types } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed_amount';
export type PromotionStatus = 'draft' | 'active' | 'inactive' | 'expired';
export type PromotionScope = 'global' | 'branch';

export interface IPromotion extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  scope: PromotionScope;
  branchId?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageCount: number;
  status: PromotionStatus;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    minOrderAmount: { type: Number, min: 0, default: 0 },
    scope: {
      type: String,
      enum: ['global', 'branch'],
      required: true,
    },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'expired'],
      default: 'draft',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PromotionSchema.index({ status: 1, startDate: 1, endDate: 1 });
PromotionSchema.index({ branchId: 1, status: 1 });
PromotionSchema.index({ scope: 1, status: 1 });

export const Promotion = mongoose.model<IPromotion>('Promotion', PromotionSchema);