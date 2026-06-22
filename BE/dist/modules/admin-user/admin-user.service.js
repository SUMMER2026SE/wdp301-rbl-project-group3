"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserService = exports.AdminUserService = void 0;
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const admin_user_repository_1 = require("./admin-user.repository");
function toAdminUserResponse(user) {
    return {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        branchId: user.branchId?.toString(),
        avatarUrl: user.avatarUrl,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
class AdminUserService {
    async listUsers(query) {
        const { items, total, page, limit, totalPages } = await admin_user_repository_1.adminUserRepository.findPaginated({ keyword: query.keyword, role: query.role, status: query.status }, query.page, query.limit);
        return {
            users: items.map(toAdminUserResponse),
            pagination: { page, limit, total, totalPages },
        };
    }
    async lockUser(targetUserId, adminUserId) {
        if (targetUserId === adminUserId) {
            throw new errorHandler_middleware_1.AppError('You cannot lock your own account', 400);
        }
        const user = await admin_user_repository_1.adminUserRepository.findById(targetUserId);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        if (user.role === 'admin')
            throw new errorHandler_middleware_1.AppError('Cannot lock an admin account', 403);
        if (user.status === 'banned')
            throw new errorHandler_middleware_1.AppError('User is already locked', 400);
        const updated = await admin_user_repository_1.adminUserRepository.updateStatusById(targetUserId, 'banned', true);
        if (!updated)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        return toAdminUserResponse(updated);
    }
    async unlockUser(targetUserId) {
        const user = await admin_user_repository_1.adminUserRepository.findById(targetUserId);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        if (user.status === 'active')
            throw new errorHandler_middleware_1.AppError('User is already active', 400);
        const updated = await admin_user_repository_1.adminUserRepository.updateStatusById(targetUserId, 'active');
        if (!updated)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        return toAdminUserResponse(updated);
    }
}
exports.AdminUserService = AdminUserService;
exports.adminUserService = new AdminUserService();
//# sourceMappingURL=admin-user.service.js.map