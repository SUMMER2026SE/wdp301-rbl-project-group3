"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const user_validation_1 = require("./user.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/me', user_controller_1.userController.getProfile);
router.patch('/me', (0, user_validation_1.validate)(user_validation_1.updateProfileSchema), user_controller_1.userController.updateProfile);
router.patch('/avatar', upload_middleware_1.uploadAvatar, user_controller_1.userController.updateAvatar);
exports.default = router;
//# sourceMappingURL=user.routes.js.map