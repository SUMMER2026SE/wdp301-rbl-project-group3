import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole, UserStatus, AuthProvider } from '../types/common.types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  branchId?: Types.ObjectId;
  avatarUrl?: string;
  authProvider: AuthProvider;
  googleId?: string;
  isEmailVerified: boolean;
  emailVerifyToken?: string;
  emailVerifyTokenExpires?: Date;
  refreshTokenVersion: number;
  status: UserStatus;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    role: {
      type: String,
      enum: ['admin', 'branch_manager', 'staff', 'customer'],
      default: 'customer',
    },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    avatarUrl: { type: String },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: { type: String, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    emailVerifyTokenExpires: { type: Date, select: false },
    refreshTokenVersion: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'inactive',
    },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);