import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IShiftTemplate extends Document {
  _id: Types.ObjectId;
  branchId: Types.ObjectId;
  name: string;
  startTime: string; // e.g. '08:00'
  endTime: string;   // e.g. '16:00'
  maxStaff: number;
  status: 'active' | 'inactive';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftTemplateSchema = new Schema<IShiftTemplate>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    maxStaff: { type: Number, required: true, default: 3, min: 1 },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ShiftTemplateSchema.index({ branchId: 1, status: 1 });

export const ShiftTemplate = mongoose.model<IShiftTemplate>('ShiftTemplate', ShiftTemplateSchema);
