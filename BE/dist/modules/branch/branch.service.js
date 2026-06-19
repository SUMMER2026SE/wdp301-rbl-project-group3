"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchService = exports.BranchService = void 0;
const branch_repository_1 = require("./branch.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
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
    async updateBranch(id, data) {
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
}
exports.BranchService = BranchService;
exports.branchService = new BranchService();
//# sourceMappingURL=branch.service.js.map