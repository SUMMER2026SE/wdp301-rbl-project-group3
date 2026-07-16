"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveBackOfficeBranch = resolveBackOfficeBranch;
exports.assertBackOfficeBranchAccess = assertBackOfficeBranchAccess;
const errorHandler_middleware_1 = require("../middlewares/errorHandler.middleware");
const user_model_1 = require("../models/user.model");
async function resolveBackOfficeBranch(actor, requestedBranchId, requireBranchForAdmin = false) {
    const user = await user_model_1.User.findById(actor.userId)
        .select('role branchId status')
        .lean()
        .exec();
    if (!user || user.status !== 'active') {
        throw new errorHandler_middleware_1.AppError('Active back-office account required', 403);
    }
    if (user.role !== actor.role) {
        throw new errorHandler_middleware_1.AppError('Account permissions changed. Please login again.', 401);
    }
    if (actor.role === 'admin') {
        if (requireBranchForAdmin && !requestedBranchId) {
            throw new errorHandler_middleware_1.AppError('branchId is required', 400);
        }
        return requestedBranchId;
    }
    if (!user.branchId) {
        throw new errorHandler_middleware_1.AppError('No branch is assigned to this account', 403);
    }
    const assignedBranchId = user.branchId.toString();
    if (requestedBranchId && requestedBranchId !== assignedBranchId) {
        throw new errorHandler_middleware_1.AppError('You cannot access another branch', 403);
    }
    return assignedBranchId;
}
async function assertBackOfficeBranchAccess(actor, branchId) {
    await resolveBackOfficeBranch(actor, branchId, true);
}
//# sourceMappingURL=backOfficeAccess.util.js.map