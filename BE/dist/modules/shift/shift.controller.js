"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftController = exports.ShiftController = void 0;
const shift_service_1 = require("./shift.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class ShiftController {
    constructor() {
        // --- Shift Templates ---
        this.createTemplate = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const template = await shift_service_1.shiftService.createTemplate({
                userId: req.user.userId,
                role: req.user.role,
                branchId: req.user.branchId,
            }, req.body);
            (0, response_util_1.sendSuccess)(res, { template }, 'Shift template created successfully', 201);
        });
        this.getTemplates = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const templates = await shift_service_1.shiftService.getTemplates({
                userId: req.user.userId,
                role: req.user.role,
                branchId: req.user.branchId,
            }, req.query.branchId);
            (0, response_util_1.sendSuccess)(res, { templates }, 'Shift templates retrieved successfully');
        });
        this.updateTemplate = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const template = await shift_service_1.shiftService.updateTemplate({
                userId: req.user.userId,
                role: req.user.role,
                branchId: req.user.branchId,
            }, String(req.params.id), req.body);
            (0, response_util_1.sendSuccess)(res, { template }, 'Shift template updated successfully');
        });
        this.deleteTemplate = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            await shift_service_1.shiftService.deleteTemplate({
                userId: req.user.userId,
                role: req.user.role,
                branchId: req.user.branchId,
            }, String(req.params.id));
            (0, response_util_1.sendSuccess)(res, null, 'Shift template deleted successfully');
        });
        // --- Shift Registrations ---
        this.registerShift = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const registration = await shift_service_1.shiftService.registerShift({
                userId: req.user.userId,
                role: req.user.role,
                branchId: req.user.branchId,
            }, req.body);
            (0, response_util_1.sendSuccess)(res, { registration }, 'Shift registered successfully', 201);
        });
        this.getRegistrations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const registrations = await shift_service_1.shiftService.getRegistrations({
                userId: req.user.userId,
                role: req.user.role,
                branchId: req.user.branchId,
            }, {
                branchId: req.query.branchId,
                userId: req.query.userId,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                status: req.query.status,
            });
            (0, response_util_1.sendSuccess)(res, { registrations }, 'Shift registrations retrieved successfully');
        });
        this.cancelRegistration = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            await shift_service_1.shiftService.cancelRegistration({
                userId: req.user.userId,
                role: req.user.role,
                branchId: req.user.branchId,
            }, String(req.params.id));
            (0, response_util_1.sendSuccess)(res, null, 'Shift registration cancelled successfully');
        });
        this.reviewRegistration = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const registration = await shift_service_1.shiftService.reviewRegistration({
                userId: req.user.userId,
                role: req.user.role,
                branchId: req.user.branchId,
            }, String(req.params.id), req.body);
            const action = req.body.status === 'approved' ? 'approved' : 'rejected';
            (0, response_util_1.sendSuccess)(res, { registration }, `Shift registration ${action} successfully`);
        });
    }
}
exports.ShiftController = ShiftController;
exports.shiftController = new ShiftController();
//# sourceMappingURL=shift.controller.js.map