"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("./user.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
class UserController {
    constructor() {
        this.getProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const profile = await user_service_1.userService.getProfile(userId);
            (0, response_util_1.sendSuccess)(res, { user: profile }, 'Profile retrieved');
        });
        this.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const updated = await user_service_1.userService.updateProfile(userId, req.body);
            (0, response_util_1.sendSuccess)(res, { user: updated }, 'Profile updated');
        });
        this.updateAvatar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            if (!req.file)
                throw new errorHandler_middleware_1.AppError('No file uploaded', 400);
            const avatarUrl = await user_service_1.userService.updateAvatar(userId, req.file.buffer, req.file.mimetype);
            (0, response_util_1.sendSuccess)(res, { avatarUrl }, 'Avatar updated');
        });
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=user.controller.js.map