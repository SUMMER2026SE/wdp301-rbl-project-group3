"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_user_controller_1 = require("./admin-user.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const admin_user_validation_1 = require("./admin-user.validation");
const router = (0, express_1.Router)();
const adminRoles = ['admin'];
router.use(auth_middleware_1.authenticate);
router.use((0, role_middleware_1.authorize)(...adminRoles));
router.get('/', (0, admin_user_validation_1.validate)(admin_user_validation_1.listUsersSchema), admin_user_controller_1.adminUserController.list);
router.patch('/:id/lock', (0, admin_user_validation_1.validate)(admin_user_validation_1.userIdParamSchema), admin_user_controller_1.adminUserController.lock);
router.patch('/:id/unlock', (0, admin_user_validation_1.validate)(admin_user_validation_1.userIdParamSchema), admin_user_controller_1.adminUserController.unlock);
router.patch('/:id/role', (0, admin_user_validation_1.validate)(admin_user_validation_1.changeRoleSchema), admin_user_controller_1.adminUserController.changeRole);
exports.default = router;
//# sourceMappingURL=admin-user.routes.js.map