"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserService = exports.AdminUserService = void 0;
const mongoose_1 = require("mongoose");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const branch_service_1 = require("../branch/branch.service");
const admin_user_repository_1 = require("./admin-user.repository");
const branchManager_util_1 = require("../../utils/branchManager.util");
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
        const managerBranchId = user.role === 'branch_manager' ? user.branchId?.toString() : undefined;
        const updated = await admin_user_repository_1.adminUserRepository.updateStatusById(targetUserId, 'banned', true);
        if (!updated)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        if (managerBranchId) {
            await (0, branchManager_util_1.releaseBranchManagerWithRetry)(managerBranchId, user._id.toString());
        }
        return toAdminUserResponse(updated);
    }
    async unlockUser(targetUserId) {
        const user = await admin_user_repository_1.adminUserRepository.findById(targetUserId);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        if (user.status === 'active')
            throw new errorHandler_middleware_1.AppError('User is already active', 400);
        const shouldClaimManager = user.role === 'branch_manager';
        if (shouldClaimManager) {
            if (!user.branchId) {
                throw new errorHandler_middleware_1.AppError('Branch manager must be assigned to a branch', 409);
            }
            await (0, branchManager_util_1.claimBranchManager)(user.branchId.toString(), user._id.toString());
        }
        let updated;
        try {
            updated = await admin_user_repository_1.adminUserRepository.updateStatusById(targetUserId, 'active');
        }
        catch (error) {
            if (shouldClaimManager && user.branchId) {
                await (0, branchManager_util_1.releaseBranchManager)(user.branchId.toString(), user._id.toString());
            }
            throw error;
        }
        if (!updated) {
            if (shouldClaimManager && user.branchId) {
                await (0, branchManager_util_1.releaseBranchManager)(user.branchId.toString(), targetUserId);
            }
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        }
        return toAdminUserResponse(updated);
    }
    async changeUserRole(targetUserId, adminUserId, data) {
        if (targetUserId === adminUserId) {
            throw new errorHandler_middleware_1.AppError('You cannot change your own role', 400);
        }
        const user = await admin_user_repository_1.adminUserRepository.findById(targetUserId);
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        const currentBranchId = user.branchId?.toString();
        if (user.role === data.role &&
            (!data.branchId || data.branchId === currentBranchId)) {
            throw new errorHandler_middleware_1.AppError('User already has this role', 400);
        }
        const branchScopedRoles = ['branch_manager', 'staff'];
        let branchObjectId;
        if (branchScopedRoles.includes(data.role)) {
            if (!data.branchId) {
                throw new errorHandler_middleware_1.AppError('branchId is required for branch_manager and staff roles', 400);
            }
            const branch = await branch_service_1.branchService.getBranchById(data.branchId);
            if (branch.status !== 'active') {
                throw new errorHandler_middleware_1.AppError('Cannot assign users to an inactive branch', 409);
            }
            branchObjectId = new mongoose_1.Types.ObjectId(data.branchId);
        }
        else {
            branchObjectId = null;
        }
        const shouldClaimManager = data.role === 'branch_manager' &&
            user.status === 'active' &&
            Boolean(data.branchId) &&
            (user.role !== 'branch_manager' || currentBranchId !== data.branchId);
        if (shouldClaimManager) {
            await (0, branchManager_util_1.claimBranchManager)(data.branchId, targetUserId);
        }
        let updated;
        try {
            updated = await admin_user_repository_1.adminUserRepository.updateRoleById(targetUserId, data.role, branchObjectId);
        }
        catch (error) {
            if (shouldClaimManager && data.branchId) {
                await (0, branchManager_util_1.releaseBranchManager)(data.branchId, targetUserId);
            }
            throw error;
        }
        if (!updated) {
            if (shouldClaimManager && data.branchId) {
                await (0, branchManager_util_1.releaseBranchManager)(data.branchId, targetUserId);
            }
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        }
        if (user.role === 'branch_manager' &&
            currentBranchId &&
            (data.role !== 'branch_manager' || currentBranchId !== data.branchId)) {
            await (0, branchManager_util_1.releaseBranchManagerWithRetry)(currentBranchId, targetUserId);
        }
        return toAdminUserResponse(updated);
    }
}
exports.AdminUserService = AdminUserService;
exports.adminUserService = new AdminUserService();
//# sourceMappingURL=admin-user.service.js.map