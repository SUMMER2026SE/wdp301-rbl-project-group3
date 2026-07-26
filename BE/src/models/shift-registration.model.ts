import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IShiftRegistration extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  branchId: Types.ObjectId;
  date: Date;
  shiftTemplateId: Types.ObjectId;
  shiftName: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  managerNote?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftRegistrationSchema = new Schema<IShiftRegistration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    date: { type: Date, required: true },
    shiftTemplateId: { type: Schema.Types.ObjectId, ref: 'ShiftTemplate', required: true },
    shiftName: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    note: { type: String, trim: true, maxlength: 500 },
    managerNote: { type: String, trim: true, maxlength: 500 },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ShiftRegistrationSchema.index({ userId: 1, date: 1 });
ShiftRegistrationSchema.index({ branchId: 1, date: 1 });
ShiftRegistrationSchema.index({ date: 1, shiftTemplateId: 1 });

export const ShiftRegistration = mongoose.model<IShiftRegistration>('ShiftRegistration', ShiftRegistrationSchema);
/**
 * Defines the Mongoose schema, TypeScript contract, and persistence rules for this domain entity.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
