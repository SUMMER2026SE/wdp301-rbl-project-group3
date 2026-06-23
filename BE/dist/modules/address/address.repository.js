"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressRepository = exports.AddressRepository = void 0;
const mongoose_1 = require("mongoose");
const userAddress_model_1 = require("../../models/userAddress.model");
class AddressRepository {
    async findAllByUserId(userId) {
        return userAddress_model_1.UserAddress.find({ userId: new mongoose_1.Types.ObjectId(userId) })
            .sort({ isDefault: -1, createdAt: -1 })
            .exec();
    }
    async findByIdAndUserId(addressId, userId) {
        return userAddress_model_1.UserAddress.findOne({
            _id: new mongoose_1.Types.ObjectId(addressId),
            userId: new mongoose_1.Types.ObjectId(userId),
        }).exec();
    }
    async countByUserId(userId) {
        return userAddress_model_1.UserAddress.countDocuments({ userId: new mongoose_1.Types.ObjectId(userId) });
    }
    async create(data) {
        return userAddress_model_1.UserAddress.create({
            userId: new mongoose_1.Types.ObjectId(data.userId),
            receiverName: data.receiverName,
            phoneNumber: data.phoneNumber,
            addressDetail: data.addressDetail,
            isDefault: data.isDefault,
        });
    }
    async update(addressId, data) {
        return userAddress_model_1.UserAddress.findByIdAndUpdate(addressId, { $set: data }, { returnDocument: 'after', runValidators: true }).exec();
    }
    async delete(addressId) {
        await userAddress_model_1.UserAddress.findByIdAndDelete(addressId).exec();
    }
    async setDefault(userId, addressId) {
        await userAddress_model_1.UserAddress.updateMany({ userId: new mongoose_1.Types.ObjectId(userId) }, { $set: { isDefault: false } }).exec();
        return userAddress_model_1.UserAddress.findByIdAndUpdate(addressId, { $set: { isDefault: true } }, { returnDocument: 'after' }).exec();
    }
    async setNewestAsDefault(userId) {
        const newest = await userAddress_model_1.UserAddress.findOne({ userId: new mongoose_1.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
        if (newest) {
            await userAddress_model_1.UserAddress.findByIdAndUpdate(newest._id, { $set: { isDefault: true } }).exec();
        }
    }
}
exports.AddressRepository = AddressRepository;
exports.addressRepository = new AddressRepository();
//# sourceMappingURL=address.repository.js.map