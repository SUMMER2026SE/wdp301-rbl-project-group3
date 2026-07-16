"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressService = exports.AddressService = void 0;
const address_repository_1 = require("./address.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const MAX_ADDRESSES = 5;
function buildAddressResponse(address) {
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
class AddressService {
    async getAddresses(userId) {
        const addresses = await address_repository_1.addressRepository.findAllByUserId(userId);
        return addresses.map(buildAddressResponse);
    }
    async addAddress(userId, data) {
        const count = await address_repository_1.addressRepository.countByUserId(userId);
        if (count >= MAX_ADDRESSES)
            throw new errorHandler_middleware_1.AppError(`You can save up to ${MAX_ADDRESSES} addresses`, 400);
        const isFirst = count === 0;
        const shouldBeDefault = data.isDefault || isFirst;
        // Tạo trước với isDefault: false, rồi set default sau để tránh race condition
        const address = await address_repository_1.addressRepository.create({
            userId,
            receiverName: data.receiverName,
            phoneNumber: data.phoneNumber,
            addressDetail: data.addressDetail,
            isDefault: false,
        });
        if (shouldBeDefault) {
            const updated = await address_repository_1.addressRepository.setDefault(userId, address._id.toString());
            if (updated)
                return buildAddressResponse(updated);
        }
        return buildAddressResponse(address);
    }
    async updateAddress(userId, addressId, data) {
        const existing = await address_repository_1.addressRepository.findByIdAndUserId(addressId, userId);
        if (!existing)
            throw new errorHandler_middleware_1.AppError('Address not found', 404);
        const updated = await address_repository_1.addressRepository.update(addressId, data);
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Failed to update address', 500);
        return buildAddressResponse(updated);
    }
    async deleteAddress(userId, addressId) {
        const existing = await address_repository_1.addressRepository.findByIdAndUserId(addressId, userId);
        if (!existing)
            throw new errorHandler_middleware_1.AppError('Address not found', 404);
        await address_repository_1.addressRepository.delete(addressId);
        if (existing.isDefault) {
            await address_repository_1.addressRepository.setNewestAsDefault(userId);
        }
    }
    async setDefaultAddress(userId, addressId) {
        const existing = await address_repository_1.addressRepository.findByIdAndUserId(addressId, userId);
        if (!existing)
            throw new errorHandler_middleware_1.AppError('Address not found', 404);
        if (existing.isDefault)
            throw new errorHandler_middleware_1.AppError('This address is already the default', 400);
        const updated = await address_repository_1.addressRepository.setDefault(userId, addressId);
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Failed to set default address', 500);
        return buildAddressResponse(updated);
    }
}
exports.AddressService = AddressService;
exports.addressService = new AddressService();
//# sourceMappingURL=address.service.js.map