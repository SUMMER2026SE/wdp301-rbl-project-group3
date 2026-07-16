import mongoose, { Document, Types } from 'mongoose';
export interface IUserAddress extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    receiverName: string;
    phoneNumber: string;
    addressDetail: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserAddress: mongoose.Model<IUserAddress, {}, {}, {}, mongoose.Document<unknown, {}, IUserAddress, {}, mongoose.DefaultSchemaOptions> & IUserAddress & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUserAddress>;
//# sourceMappingURL=userAddress.model.d.ts.map