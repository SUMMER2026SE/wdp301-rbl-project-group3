import mongoose, { Document, Schema, Types } from 'mongoose';

export type BranchStatus = 'active' | 'inactive';

export interface IBranch extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  address: string;
  phone?: string;
  managerId?: Types.ObjectId;
  status: BranchStatus;
  openingTime?: string;
  closingTime?: string;
  activeDays?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    openingTime: { type: String, default: '08:00' },
    closingTime: { type: String, default: '22:00' },
    activeDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

BranchSchema.index({ code: 1 });
BranchSchema.index({ status: 1 });

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
