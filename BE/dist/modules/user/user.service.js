"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const user_repository_1 = require("./user.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const cloudinary_config_1 = require("../../config/cloudinary.config");
function toProfileResponse(user) {
    return {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        avatarUrl: user.avatarUrl,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        points: user.points || 0,
        lifetimePoints: user.lifetimePoints || 0,
        memberLevel: user.memberLevel || 'new',
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        branchId: user.branchId?.toString(),
    };
}
class UserService {
    async getProfile(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        return toProfileResponse(user);
    }
    async updateProfile(userId, data) {
        // Không cho phép body rỗng
        const hasUpdate = data.fullName !== undefined || data.phone !== undefined || data.address !== undefined;
        if (!hasUpdate)
            throw new errorHandler_middleware_1.AppError('No valid fields provided to update', 400);
        const user = await user_repository_1.userRepository.updateProfileById(userId, data);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        return toProfileResponse(user);
    }
    async updateAvatar(userId, fileBuffer, mimetype) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        // Xoá avatar cũ trên Cloudinary nếu có (tránh orphan files)
        const publicId = `minimart/avatars/user_${userId}`;
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary_config_1.cloudinary.uploader.upload_stream({
                folder: 'minimart/avatars',
                public_id: `user_${userId}`,
                overwrite: true,
                resource_type: 'image',
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                ],
            }, (error, uploadResult) => {
                if (error || !uploadResult) {
                    return reject(error || new Error('Upload failed'));
                }
                resolve(uploadResult);
            });
            uploadStream.end(fileBuffer);
        });
        const updatedUser = await user_repository_1.userRepository.updateAvatarById(userId, result.secure_url);
        if (!updatedUser)
            throw new errorHandler_middleware_1.AppError('Failed to update avatar', 500);
        return result.secure_url;
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map