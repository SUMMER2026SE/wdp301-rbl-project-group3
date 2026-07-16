import { addressRepository } from './address.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IUserAddress } from '../../models/userAddress.model';

const MAX_ADDRESSES = 5;

function buildAddressResponse(address: IUserAddress) {
    return {
        addressId: address._id.toString(),
        receiverName: address.receiverName,
        phoneNumber: address.phoneNumber,
        addressDetail: address.addressDetail,
        isDefault: address.isDefault,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
    };
}

export class AddressService {
    async getAddresses(userId: string) {
        const addresses = await addressRepository.findAllByUserId(userId);
        return addresses.map(buildAddressResponse);
    }

    async addAddress(
        userId: string,
        data: {
            receiverName: string;
            phoneNumber: string;
            addressDetail: string;
            isDefault?: boolean;
        }
    ) {
        const count = await addressRepository.countByUserId(userId);
        if (count >= MAX_ADDRESSES)
            throw new AppError(`You can save up to ${MAX_ADDRESSES} addresses`, 400);

        const isFirst = count === 0;
        const shouldBeDefault = data.isDefault || isFirst;

        // Tạo trước với isDefault: false, rồi set default sau để tránh race condition
        const address = await addressRepository.create({
            userId,
            receiverName: data.receiverName,
            phoneNumber: data.phoneNumber,
            addressDetail: data.addressDetail,
            isDefault: false,
        });

        if (shouldBeDefault) {
            const updated = await addressRepository.setDefault(userId, address._id.toString());
            if (updated) return buildAddressResponse(updated);
        }

        return buildAddressResponse(address);
    }

    async updateAddress(
        userId: string,
        addressId: string,
        data: { receiverName?: string; phoneNumber?: string; addressDetail?: string }
    ) {
        const existing = await addressRepository.findByIdAndUserId(addressId, userId);
        if (!existing) throw new AppError('Address not found', 404);

        const updated = await addressRepository.update(addressId, data);
        if (!updated) throw new AppError('Failed to update address', 500);
        return buildAddressResponse(updated);
    }

    async deleteAddress(userId: string, addressId: string) {
        const existing = await addressRepository.findByIdAndUserId(addressId, userId);
        if (!existing) throw new AppError('Address not found', 404);

        await addressRepository.delete(addressId);

        if (existing.isDefault) {
            await addressRepository.setNewestAsDefault(userId);
        }
    }

    async setDefaultAddress(userId: string, addressId: string) {
        const existing = await addressRepository.findByIdAndUserId(addressId, userId);
        if (!existing) throw new AppError('Address not found', 404);
        if (existing.isDefault) throw new AppError('This address is already the default', 400);

        const updated = await addressRepository.setDefault(userId, addressId);
        if (!updated) throw new AppError('Failed to set default address', 500);
        return buildAddressResponse(updated);
    }
}

export const addressService = new AddressService();
