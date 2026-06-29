import mongoose, { Document, Types } from 'mongoose';
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
    points: number;
    lifetimePoints: number;
    memberLevel: 'new' | 'bronze' | 'silver' | 'gold' | 'diamond';
    lastLoginAt?: Date;
    passwordChangedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
//# sourceMappingURL=user.model.d.ts.map