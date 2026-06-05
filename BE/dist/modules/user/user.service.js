"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const user_repository_1 = require("./user.repository");
const auth_service_1 = require("../auth/auth.service");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
class UserService {
    async getProfile(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        return {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            avatarUrl: user.avatarUrl,
            authProvider: user.authProvider,
            isEmailVerified: user.isEmailVerified,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        };
    }
    async updateProfile(userId, data) {
        const user = await user_repository_1.userRepository.updateById(userId, data);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        return {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            avatarUrl: user.avatarUrl,
        };
    }
    async updateAvatar(userId, fileBuffer, mimetype) {
        return auth_service_1.authService.uploadAvatar(userId, fileBuffer, mimetype);
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map