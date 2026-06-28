import mongoose, { Document, Schema, Types } from 'mongoose';

export type SettingGroup = 'general' | 'order' | 'delivery' | 'inventory' | 'payment' | 'notification' | 'loyalty';
export type SettingValueType = 'string' | 'number' | 'boolean';

export interface ISystemSetting extends Document {
  _id: Types.ObjectId;
  key: string;
  label: string;
  group: SettingGroup;
  value: string | number | boolean;
  valueType: SettingValueType;
  description?: string;
  isPublic: boolean;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true, maxlength: 100 },
    group: {
      type: String,
      enum: ['general', 'order', 'delivery', 'inventory', 'payment', 'notification', 'loyalty'],
      required: true,
    },
    value: { type: Schema.Types.Mixed, required: true },
    valueType: {
      type: String,
      enum: ['string', 'number', 'boolean'],
      required: true,
    },
    description: { type: String, trim: true, maxlength: 500 },
    isPublic: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

SystemSettingSchema.index({ key: 1 });
SystemSettingSchema.index({ group: 1 });

export const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
