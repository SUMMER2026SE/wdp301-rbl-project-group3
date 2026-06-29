import { Types } from 'mongoose';
import { UserAddress, IUserAddress } from '../../models/userAddress.model';

export class AddressRepository {
    async findAllByUserId(userId: string): Promise<IUserAddress[]> {
        return UserAddress.find({ userId: new Types.ObjectId(userId) })
            .sort({ isDefault: -1, createdAt: -1 })
            .exec();
    }

    async findByIdAndUserId(addressId: string, userId: string): Promise<IUserAddress | null> {
        return UserAddress.findOne({
            _id: new Types.ObjectId(addressId),
            userId: new Types.ObjectId(userId),
        }).exec();
    }

    async countByUserId(userId: string): Promise<number> {
        return UserAddress.countDocuments({ userId: new Types.ObjectId(userId) });
    }

    async create(data: {
        userId: string;
        receiverName: string;
        phoneNumber: string;
        addressDetail: string;
        isDefault: boolean;
    }): Promise<IUserAddress> {
        return UserAddress.create({
            userId: new Types.ObjectId(data.userId),
            receiverName: data.receiverName,
            phoneNumber: data.phoneNumber,
            addressDetail: data.addressDetail,
            isDefault: data.isDefault,
        });
    }

    async update(
        addressId: string,
        data: Partial<Pick<IUserAddress, 'receiverName' | 'phoneNumber' | 'addressDetail'>>
    ): Promise<IUserAddress | null> {
        return UserAddress.findByIdAndUpdate(
            addressId,
            { $set: data },
            { returnDocument: 'after', runValidators: true }
        ).exec();
    }

    async delete(addressId: string): Promise<void> {
        await UserAddress.findByIdAndDelete(addressId).exec();
    }

    async setDefault(userId: string, addressId: string): Promise<IUserAddress | null> {
        await UserAddress.updateMany(
            { userId: new Types.ObjectId(userId) },
            { $set: { isDefault: false } }
        ).exec();
        return UserAddress.findByIdAndUpdate(
            addressId,
            { $set: { isDefault: true } },
            { returnDocument: 'after' }
        ).exec();
    }

    async setNewestAsDefault(userId: string): Promise<void> {
        const newest = await UserAddress.findOne({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
        if (newest) {
            await UserAddress.findByIdAndUpdate(newest._id, { $set: { isDefault: true } }).exec();
        }
    }
}

export const addressRepository = new AddressRepository();
