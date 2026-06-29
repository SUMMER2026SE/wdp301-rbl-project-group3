"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("./product.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const product_validation_1 = require("./product.validation");
const router = (0, express_1.Router)();
const backOfficeRoles = ['admin', 'branch_manager', 'staff'];
router.get('/', (0, product_validation_1.validate)(product_validation_1.listProductsSchema), product_controller_1.productController.list);
router.get('/:id', (0, product_validation_1.validate)(product_validation_1.productIdParamSchema), product_controller_1.productController.getById);
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...backOfficeRoles), upload_middleware_1.uploadProductImage, (0, product_validation_1.validate)(product_validation_1.createProductSchema), product_controller_1.productController.create);
router.patch('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...backOfficeRoles), upload_middleware_1.uploadProductImage, (0, product_validation_1.validate)(product_validation_1.updateProductSchema), product_controller_1.productController.update);
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...backOfficeRoles), (0, product_validation_1.validate)(product_validation_1.productIdParamSchema), product_controller_1.productController.delete);
exports.default = router;
//# sourceMappingURL=product.routes.js.map