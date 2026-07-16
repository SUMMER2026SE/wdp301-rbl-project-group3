import mongoose, { Document, Types } from 'mongoose';
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
export declare const PasswordReset: mongoose.Model<IPasswordReset, {}, {}, {}, mongoose.Document<unknown, {}, IPasswordReset, {}, mongoose.DefaultSchemaOptions> & IPasswordReset & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPasswordReset>;
//# sourceMappingURL=passwordReset.model.d.ts.map