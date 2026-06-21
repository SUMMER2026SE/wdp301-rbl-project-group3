import mongoose, { Document, Schema, Types } from 'mongoose';

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

const UserAddressSchema = new Schema<IUserAddress>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        receiverName: { type: String, required: true, trim: true },
        phoneNumber: { type: String, required: true, trim: true },
        addressDetail: { type: String, required: true, trim: true },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false }
);

UserAddressSchema.index({ userId: 1 });

export const UserAddress = mongoose.model<IUserAddress>('UserAddress', UserAddressSchema);
