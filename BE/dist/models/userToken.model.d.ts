import mongoose, { Document, Types } from 'mongoose';
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
export declare const UserToken: mongoose.Model<IUserToken, {}, {}, {}, mongoose.Document<unknown, {}, IUserToken, {}, mongoose.DefaultSchemaOptions> & IUserToken & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUserToken>;
//# sourceMappingURL=userToken.model.d.ts.map