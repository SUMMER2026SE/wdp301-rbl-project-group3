"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchController = exports.BranchController = void 0;
const branch_service_1 = require("./branch.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
class BranchController {
    constructor() {
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const branch = await branch_service_1.branchService.createBranch(req.body);
            (0, response_util_1.sendSuccess)(res, { branch }, 'Branch created', 201);
        });
        this.getAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const branches = await branch_service_1.branchService.getBranches({
                status: req.query.status,
                keyword: req.query.keyword,
            });
            (0, response_util_1.sendSuccess)(res, { branches }, 'Branches retrieved');
        });
        this.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const branch = await branch_service_1.branchService.getBranchById(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { branch }, 'Branch retrieved');
        });
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = req.user;
            if (!caller) {
                throw new errorHandler_middleware_1.AppError('Authentication required', 401);
            }
            const branch = await branch_service_1.branchService.updateBranch(String(req.params.id), req.body, {
                role: caller.role,
                branchId: caller.branchId?.toString(),
                email: caller.email,
            });
            (0, response_util_1.sendSuccess)(res, { branch }, 'Branch updated');
        });
        this.deactivate = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const branch = await branch_service_1.branchService.deactivateBranch(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { branch }, 'Branch deactivated');
        });
        this.getQuickStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = req.user;
            if (!caller) {
                throw new errorHandler_middleware_1.AppError('Authentication required', 401);
            }
            const stats = await branch_service_1.branchService.getBranchQuickStats(String(req.params.id), {
                role: caller.role,
                branchId: caller.branchId?.toString(),
            });
            (0, response_util_1.sendSuccess)(res, stats, 'Branch statistics retrieved');
        });
    }
}
exports.BranchController = BranchController;
exports.branchController = new BranchController();
//# sourceMappingURL=branch.controller.js.map