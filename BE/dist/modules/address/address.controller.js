"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressController = exports.AddressController = void 0;
const address_service_1 = require("./address.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class AddressController {
    constructor() {
        this.getAddresses = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const addresses = await address_service_1.addressService.getAddresses(req.user.userId);
            (0, response_util_1.sendSuccess)(res, { addresses }, 'Addresses retrieved');
        });
        this.addAddress = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { receiverName, phoneNumber, addressDetail, isDefault } = req.body;
            const address = await address_service_1.addressService.addAddress(req.user.userId, {
                receiverName, phoneNumber, addressDetail, isDefault,
            });
            (0, response_util_1.sendSuccess)(res, { address }, 'Address added', 201);
        });
        this.updateAddress = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const addressId = req.params['addressId'];
            const { receiverName, phoneNumber, addressDetail } = req.body;
            const address = await address_service_1.addressService.updateAddress(req.user.userId, addressId, { receiverName, phoneNumber, addressDetail });
            (0, response_util_1.sendSuccess)(res, { address }, 'Address updated');
        });
        this.deleteAddress = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const addressId = req.params['addressId'];
            await address_service_1.addressService.deleteAddress(req.user.userId, addressId);
            (0, response_util_1.sendSuccess)(res, null, 'Address deleted');
        });
        this.setDefault = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const addressId = req.params['addressId'];
            const address = await address_service_1.addressService.setDefaultAddress(req.user.userId, addressId);
            (0, response_util_1.sendSuccess)(res, { address }, 'Default address updated');
        });
    }
}
exports.AddressController = AddressController;
exports.addressController = new AddressController();
//# sourceMappingURL=address.controller.js.map