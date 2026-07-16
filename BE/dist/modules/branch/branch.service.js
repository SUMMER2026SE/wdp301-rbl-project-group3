"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchService = exports.BranchService = void 0;
const branch_repository_1 = require("./branch.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const mongoose_1 = require("mongoose");
const user_model_1 = require("../../models/user.model");
const inventory_model_1 = require("../../models/inventory.model");
const order_model_1 = require("../../models/order.model");
class BranchService {
    async createBranch(data) {
        const existing = await branch_repository_1.branchRepository.findByCode(String(data.code));
        if (existing)
            throw new errorHandler_middleware_1.AppError('Branch code already exists', 409);
        return branch_repository_1.branchRepository.create({
            ...data,
            code: String(data.code).toUpperCase(),
        });
    }
    async getBranches(filters) {
        return branch_repository_1.branchRepository.findAll(filters);
    }
    async getBranchById(id) {
        const branch = await branch_repository_1.branchRepository.findById(id);
        if (!branch)
            throw new errorHandler_middleware_1.AppError('Branch not found', 404);
        return branch;
    }
    async updateBranch(id, data, caller) {
        if (caller.role === 'branch_manager') {
            if (caller.branchId !== id) {
                throw new errorHandler_middleware_1.AppError('You can only update your own branch.', 403);
            }
            // Check if trying to update forbidden fields
            const forbiddenFields = ['name', 'code', 'address', 'managerId', 'status'];
            const keys = Object.keys(data);
            const containsForbidden = keys.some((key) => forbiddenFields.includes(key));
            if (containsForbidden) {
                throw new errorHandler_middleware_1.AppError('You are not authorized to update core branch fields (name, code, address, manager, status)', 403);
            }
        }
        else if (caller.role !== 'admin') {
            throw new errorHandler_middleware_1.AppError('Insufficient permissions', 403);
        }
        if (data.code) {
            const existing = await branch_repository_1.branchRepository.findByCode(String(data.code));
            if (existing && existing._id.toString() !== id) {
                throw new errorHandler_middleware_1.AppError('Branch code already exists', 409);
            }
            data.code = String(data.code).toUpperCase();
        }
        const updated = await branch_repository_1.branchRepository.updateById(id, data);
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Branch not found', 404);
        return updated;
    }
    async deactivateBranch(id) {
        const updated = await branch_repository_1.branchRepository.updateById(id, { status: 'inactive' });
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Branch not found', 404);
        return updated;
    }
    async getBranchQuickStats(branchId, caller) {
        if (caller.role !== 'admin' && caller.branchId !== branchId) {
            throw new errorHandler_middleware_1.AppError('You are not authorized to view this branch\'s statistics', 403);
        }
        const branchObjectId = new mongoose_1.Types.ObjectId(branchId);
        // 1. Count Active Employees
        const employeeCount = await user_model_1.User.countDocuments({
            branchId: branchObjectId,
            role: { $in: ['branch_manager', 'staff'] },
            status: 'active',
        }).exec();
        // 2. Count Inventory items
        const productCount = await inventory_model_1.Inventory.countDocuments({
            branchId: branchObjectId,
        }).exec();
        // 3. Count Today's Orders and calculate Revenue
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const todayOrders = await order_model_1.Order.find({
            branchId: branchObjectId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'cancelled' },
        }).select('totalAmount').exec();
        const todayOrderCount = todayOrders.length;
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        return {
            employeeCount,
            productCount,
            todayRevenue,
            todayOrderCount,
        };
    }
}
exports.BranchService = BranchService;
exports.branchService = new BranchService();
//# sourceMappingURL=branch.service.js.map