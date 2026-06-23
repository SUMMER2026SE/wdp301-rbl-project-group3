"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const address_controller_1 = require("./address.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const address_validation_1 = require("./address.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('customer'));
router.get('/', address_controller_1.addressController.getAddresses);
router.post('/', (0, address_validation_1.validate)(address_validation_1.addAddressSchema), address_controller_1.addressController.addAddress);
router.patch('/:addressId', (0, address_validation_1.validate)(address_validation_1.updateAddressSchema), address_controller_1.addressController.updateAddress);
router.delete('/:addressId', (0, address_validation_1.validate)(address_validation_1.addressIdParamSchema), address_controller_1.addressController.deleteAddress);
router.patch('/:addressId/default', (0, address_validation_1.validate)(address_validation_1.addressIdParamSchema), address_controller_1.addressController.setDefault);
exports.default = router;
//# sourceMappingURL=address.routes.js.map