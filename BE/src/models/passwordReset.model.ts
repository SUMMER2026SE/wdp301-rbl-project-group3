import mongoose, { Document, Schema, Types } from 'mongoose';

export type PasswordResetType = 'forgot_password' | 'change_password';

export interface IPasswordReset extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  type: PasswordResetType;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    type: {
      type: String,
      enum: ['forgot_password', 'change_password'],
      required: true,
    },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

PasswordResetSchema.index({ userId: 1, type: 1 });
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);