import mongoose, { Document, Schema, Types } from 'mongoose';
import { DeviceType } from '../types/common.types';

export interface IUserToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshTokenHash: string;
  deviceType: DeviceType;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

const UserTokenSchema = new Schema<IUserToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    refreshTokenHash: { type: String, required: true },
    deviceType: {
      type: String,
      enum: ['web', 'mobile', 'unknown'],
      default: 'unknown',
    },
    deviceName: { type: String, default: 'Unknown Device' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

UserTokenSchema.index({ userId: 1 });
UserTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserToken = mongoose.model<IUserToken>('UserToken', UserTokenSchema);