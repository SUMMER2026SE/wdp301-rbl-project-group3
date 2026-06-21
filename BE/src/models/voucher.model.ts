import mongoose, { Document, Schema, Types } from 'mongoose';
import { DiscountType } from './promotion.model';

export type VoucherStatus = 'active' | 'used' | 'expired' | 'disabled';

export interface IVoucher extends Document {
  _id: Types.ObjectId;
  code: string;
  promotionId: Types.ObjectId;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  branchId?: Types.ObjectId;
  expiresAt: Date;
  status: VoucherStatus;
  usedBy?: Types.ObjectId;
  usedAt?: Date;
  orderId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
    },
    promotionId: { type: Schema.Types.ObjectId, ref: 'Promotion', required: true },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    minOrderAmount: { type: Number, min: 0, default: 0 },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'used', 'expired', 'disabled'],
      default: 'active',
    },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

VoucherSchema.index({ code: 1 }, { unique: true });
VoucherSchema.index({ promotionId: 1, status: 1 });
VoucherSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
VoucherSchema.index({ branchId: 1, status: 1 });

export const Voucher = mongoose.model<IVoucher>('Voucher', VoucherSchema);