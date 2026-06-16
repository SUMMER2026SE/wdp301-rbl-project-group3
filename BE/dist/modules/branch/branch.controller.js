"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchController = exports.BranchController = void 0;
const branch_service_1 = require("./branch.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
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
            const branch = await branch_service_1.branchService.updateBranch(String(req.params.id), req.body);
            (0, response_util_1.sendSuccess)(res, { branch }, 'Branch updated');
        });
        this.deactivate = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const branch = await branch_service_1.branchService.deactivateBranch(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { branch }, 'Branch deactivated');
        });
    }
}
exports.BranchController = BranchController;
exports.branchController = new BranchController();
//# sourceMappingURL=branch.controller.js.map