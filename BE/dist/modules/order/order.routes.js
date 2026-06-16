"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("./order.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const order_validation_1 = require("./order.validation");
const router = (0, express_1.Router)();
const backOfficeRoles = ['superadmin', 'admin', 'manager', 'staff'];
router.use(auth_middleware_1.authenticate);
router.use((0, role_middleware_1.authorize)(...backOfficeRoles));
router.get('/', (0, order_validation_1.validate)(order_validation_1.listOrdersSchema), order_controller_1.orderController.getAll);
router.patch('/:id/confirm', (0, order_validation_1.validate)(order_validation_1.orderIdParamSchema), order_controller_1.orderController.confirm);
router.patch('/:id/status', (0, order_validation_1.validate)(order_validation_1.updateOrderStatusSchema), order_controller_1.orderController.updateStatus);
router.get('/:id', (0, order_validation_1.validate)(order_validation_1.orderIdParamSchema), order_controller_1.orderController.getById);
exports.default = router;
//# sourceMappingURL=order.routes.js.map