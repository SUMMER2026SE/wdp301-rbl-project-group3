"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimBranchManager = claimBranchManager;
exports.releaseBranchManager = releaseBranchManager;
exports.releaseBranchManagerWithRetry = releaseBranchManagerWithRetry;
const mongoose_1 = require("mongoose");
const errorHandler_middleware_1 = require("../middlewares/errorHandler.middleware");
const branch_model_1 = require("../models/branch.model");
const user_model_1 = require("../models/user.model");
async function claimBranchManager(branchId, employeeId) {
    const branch = await branch_model_1.Branch.findById(branchId).select('managerId status').lean().exec();
    if (!branch || branch.status !== 'active') {
        throw new errorHandler_middleware_1.AppError('Active branch not found', 404);
    }
    const existingManager = await user_model_1.User.findOne({
        _id: { $ne: employeeId },
        branchId,
        role: 'branch_manager',
        status: 'active',
    })
        .select('_id')
        .lean()
        .exec();
    if (existingManager) {
        throw new errorHandler_middleware_1.AppError('This branch already has a manager', 409);
    }
    let staleManagerId;
    if (branch.managerId &&
        branch.managerId.toString() !== employeeId) {
        const referencedManager = await user_model_1.User.findById(branch.managerId)
            .select('role branchId status')
            .lean()
            .exec();
        const assignmentIsValid = referencedManager?.status === 'active' &&
            referencedManager.role === 'branch_manager' &&
            referencedManager.branchId?.toString() === branchId;
        if (assignmentIsValid) {
            throw new errorHandler_middleware_1.AppError('This branch already has a manager', 409);
        }
        staleManagerId = branch.managerId;
    }
    const managerConditions = [
        { managerId: { $exists: false } },
        { managerId: null },
        { managerId: new mongoose_1.Types.ObjectId(employeeId) },
    ];
    if (staleManagerId)
        managerConditions.push({ managerId: staleManagerId });
    const claimed = await branch_model_1.Branch.findOneAndUpdate({
        _id: branchId,
        status: 'active',
        $or: managerConditions,
    }, { $set: { managerId: new mongoose_1.Types.ObjectId(employeeId) } }, { new: true }).exec();
    if (!claimed) {
        throw new errorHandler_middleware_1.AppError('This branch already has a manager', 409);
    }
}
async function releaseBranchManager(branchId, employeeId) {
    await branch_model_1.Branch.updateOne({ _id: branchId, managerId: employeeId }, { $unset: { managerId: 1 } }).exec();
}
async function releaseBranchManagerWithRetry(branchId, employeeId) {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            await releaseBranchManager(branchId, employeeId);
            return;
        }
        catch (error) {
            lastError = error;
        }
    }
    console.error('[BRANCH_MANAGER_RELEASE_FAILED]', {
        branchId,
        employeeId,
        error: lastError,
    });
}
//# sourceMappingURL=branchManager.util.js.map