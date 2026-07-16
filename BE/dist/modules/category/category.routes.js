"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("./category.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const category_validation_1 = require("./category.validation");
const router = (0, express_1.Router)();
const adminRoles = ['admin'];
router.get('/', (0, category_validation_1.validate)(category_validation_1.listCategoriesSchema), category_controller_1.categoryController.getAll);
router.get('/:id', (0, category_validation_1.validate)(category_validation_1.categoryIdParamSchema), category_controller_1.categoryController.getById);
router.post('/', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...adminRoles), (0, category_validation_1.validate)(category_validation_1.createCategorySchema), category_controller_1.categoryController.create);
router.patch('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...adminRoles), (0, category_validation_1.validate)(category_validation_1.updateCategorySchema), category_controller_1.categoryController.update);
router.delete('/:id', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(...adminRoles), (0, category_validation_1.validate)(category_validation_1.categoryIdParamSchema), category_controller_1.categoryController.delete);
exports.default = router;
//# sourceMappingURL=category.routes.js.map