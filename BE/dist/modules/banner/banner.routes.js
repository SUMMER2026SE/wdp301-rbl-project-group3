"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const banner_controller_1 = require("./banner.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const banner_validation_1 = require("./banner.validation");
const router = (0, express_1.Router)();
const backOfficeRoles = ['admin', 'branch_manager', 'staff'];
const managerRoles = ['admin', 'branch_manager'];
// Public Route
router.get('/active', banner_controller_1.bannerController.getActive);
// Protected routes (Authentication required for all below)
router.use(auth_middleware_1.authenticate);
// Staff and higher can list/get
router.get('/', (0, role_middleware_1.authorize)(...backOfficeRoles), (0, banner_validation_1.validate)(banner_validation_1.listBannersSchema), banner_controller_1.bannerController.list);
router.get('/:id', (0, role_middleware_1.authorize)(...backOfficeRoles), (0, banner_validation_1.validate)(banner_validation_1.bannerIdParamSchema), banner_controller_1.bannerController.getById);
// Manager and Admin can create, update, delete
router.post('/', (0, role_middleware_1.authorize)(...managerRoles), upload_middleware_1.uploadBannerImage, (0, banner_validation_1.validate)(banner_validation_1.createBannerSchema), banner_controller_1.bannerController.create);
router.patch('/:id', (0, role_middleware_1.authorize)(...managerRoles), upload_middleware_1.uploadBannerImage, (0, banner_validation_1.validate)(banner_validation_1.updateBannerSchema), banner_controller_1.bannerController.update);
router.delete('/:id', (0, role_middleware_1.authorize)(...managerRoles), (0, banner_validation_1.validate)(banner_validation_1.bannerIdParamSchema), banner_controller_1.bannerController.delete);
exports.default = router;
//# sourceMappingURL=banner.routes.js.map