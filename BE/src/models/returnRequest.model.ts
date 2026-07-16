import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReturnStatus =
  | 'pending'
  | 'approved'
  | 'completing'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type ReturnItemCondition = 'resellable' | 'damaged' | 'expired';
export type RefundMethod =
  | 'cash'
  | 'bank_transfer'
  | 'original_payment'
  | 'other';
export type RefundStatus = 'pending' | 'completed';

export interface IReturnItem {
  productId: Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  condition: ReturnItemCondition;
}

export interface IReturnRequest extends Document {
  _id: Types.ObjectId;
  code: string;
  orderId: Types.ObjectId;
  orderCode: string;
  customerId: Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  branchId: Types.ObjectId;
  branchName: string;
  branchAddress: string;
  items: IReturnItem[];
  reason: string;
  totalRefund: number;
  status: ReturnStatus;
  createdBy: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  resolutionNote?: string;
  completedBy?: Types.ObjectId;
  completedAt?: Date;
  completionLockId?: string;
  completionLockedAt?: Date;
  refundStatus: RefundStatus;
  refundMethod?: RefundMethod;
  refundReference?: string;
  refundedBy?: Types.ObjectId;
  refundedAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema<IReturnItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    refundAmount: { type: Number, required: true, min: 0 },
    condition: {
      type: String,
      enum: ['resellable', 'damaged', 'expired'],
      required: true,
    },
  },
  { _id: false }
);

const ReturnRequestSchema = new Schema<IReturnRequest>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    orderCode: { type: String, required: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    branchName: { type: String, required: true, trim: true },
    branchAddress: { type: String, required: true, trim: true },
    items: { type: [ReturnItemSchema], required: true },
    reason: { type: String, required: true, trim: true },
    totalRefund: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completing', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    resolutionNote: { type: String, trim: true },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    completionLockId: { type: String },
    completionLockedAt: { type: Date },
    refundStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    refundMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'original_payment', 'other'],
    },
    refundReference: { type: String, trim: true },
    refundedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    refundedAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false }
);

ReturnRequestSchema.index({ orderId: 1, createdAt: -1 });
ReturnRequestSchema.index({ branchId: 1, status: 1, createdAt: -1 });
ReturnRequestSchema.index({ customerId: 1, createdAt: -1 });

export const ReturnRequest = mongoose.model<IReturnRequest>(
  'ReturnRequest',
  ReturnRequestSchema
);
