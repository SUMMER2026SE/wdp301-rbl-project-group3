"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("./product.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const product_validation_1 = require("./product.validation");
const router = (0, express_1.Router)();
const backOfficeRoles = ['superadmin', 'admin', 'manager', 'staff'];
router.use(auth_middleware_1.authenticate);
router.use((0, role_middleware_1.authorize)(...backOfficeRoles));
router.get('/', (0, product_validation_1.validate)(product_validation_1.listProductsSchema), product_controller_1.productController.getAll);
router.post('/', (0, product_validation_1.validate)(product_validation_1.createProductSchema), product_controller_1.productController.create);
exports.default = router;
//# sourceMappingURL=product.routes.js.map