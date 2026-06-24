"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statisticsController = exports.StatisticsController = void 0;
const statistics_service_1 = require("./statistics.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const user_model_1 = require("../../models/user.model");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
// Lấy CallerContext đầy đủ — branch_manager/staff cần branchId từ DB (JWT không chứa branchId)
async function buildCallerContext(req) {
    const { userId, role } = req.user;
    if (role === 'branch_manager' || role === 'staff') {
        const user = await user_model_1.User.findById(userId).select('branchId').exec();
        if (!user)
            throw new errorHandler_middleware_1.AppError('User not found', 404);
        return { userId, role, branchId: user.branchId?.toString() };
    }
    return { userId, role };
}
// Helper: lấy 1 query param dạng string an toàn (tránh lỗi string | string[])
function queryStr(value) {
    if (Array.isArray(value))
        return value[0];
    if (typeof value === 'string')
        return value;
    return undefined;
}
class StatisticsController {
    constructor() {
        // ═══════════════════════════════════════════════════════════════════════════
        // DASHBOARDS BY ROLE
        // ═══════════════════════════════════════════════════════════════════════════
        this.getAdminDashboard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const from = queryStr(req.query.from);
            const to = queryStr(req.query.to);
            const groupBy = queryStr(req.query.groupBy);
            const result = await statistics_service_1.statisticsService.getAdminDashboard(caller, { from, to, groupBy });
            (0, response_util_1.sendSuccess)(res, result, 'Admin dashboard retrieved');
        });
        this.getBranchDashboard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const branchId = queryStr(req.query.branchId);
            const from = queryStr(req.query.from);
            const to = queryStr(req.query.to);
            const groupBy = queryStr(req.query.groupBy);
            const result = await statistics_service_1.statisticsService.getBranchDashboard(caller, branchId, { from, to, groupBy });
            (0, response_util_1.sendSuccess)(res, result, 'Branch dashboard retrieved');
        });
        this.getStaffDashboard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const from = queryStr(req.query.from);
            const to = queryStr(req.query.to);
            const groupBy = queryStr(req.query.groupBy);
            const result = await statistics_service_1.statisticsService.getStaffDashboard(caller, { from, to, groupBy });
            (0, response_util_1.sendSuccess)(res, result, 'Staff dashboard retrieved');
        });
        this.getCustomerDashboard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const from = queryStr(req.query.from);
            const to = queryStr(req.query.to);
            const groupBy = queryStr(req.query.groupBy);
            const result = await statistics_service_1.statisticsService.getCustomerDashboard(caller, { from, to, groupBy });
            (0, response_util_1.sendSuccess)(res, result, 'Customer dashboard retrieved');
        });
        // ═══════════════════════════════════════════════════════════════════════════
        // LEGACY ADMIN (Preserved for compatibility)
        // ═══════════════════════════════════════════════════════════════════════════
        this.getAdminOverview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const result = await statistics_service_1.statisticsService.getAdminOverview(caller);
            (0, response_util_1.sendSuccess)(res, result, 'System statistics retrieved');
        });
        this.getUserRegistrationTrend = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const from = queryStr(req.query.from);
            const to = queryStr(req.query.to);
            const groupBy = queryStr(req.query.groupBy);
            const result = await statistics_service_1.statisticsService.getUserRegistrationTrend(caller, { from, to, groupBy });
            (0, response_util_1.sendSuccess)(res, result, 'User registration trend retrieved');
        });
        this.getTopPromotions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const limitStr = queryStr(req.query.limit);
            const limit = limitStr ? Number(limitStr) : 10;
            const result = await statistics_service_1.statisticsService.getTopPromotions(caller, limit);
            (0, response_util_1.sendSuccess)(res, result, 'Top promotions retrieved');
        });
        this.getVoucherUsageTrend = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const from = queryStr(req.query.from);
            const to = queryStr(req.query.to);
            const groupBy = queryStr(req.query.groupBy);
            const result = await statistics_service_1.statisticsService.getVoucherUsageTrend(caller, { from, to, groupBy });
            (0, response_util_1.sendSuccess)(res, result, 'Voucher usage trend retrieved');
        });
        // ═══════════════════════════════════════════════════════════════════════════
        // LEGACY BRANCH (Preserved for compatibility)
        // ═══════════════════════════════════════════════════════════════════════════
        this.getBranchOverview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const branchId = queryStr(req.query.branchId);
            const result = await statistics_service_1.statisticsService.getBranchOverview(caller, branchId);
            (0, response_util_1.sendSuccess)(res, result, 'Branch statistics retrieved');
        });
        this.getBranchVoucherUsageTrend = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const branchId = queryStr(req.query.branchId);
            const from = queryStr(req.query.from);
            const to = queryStr(req.query.to);
            const groupBy = queryStr(req.query.groupBy);
            const result = await statistics_service_1.statisticsService.getBranchVoucherUsageTrend(caller, branchId, {
                from,
                to,
                groupBy,
            });
            (0, response_util_1.sendSuccess)(res, result, 'Branch voucher usage trend retrieved');
        });
        // ═══════════════════════════════════════════════════════════════════════════
        // LEGACY PERSONAL (Preserved for compatibility)
        // ═══════════════════════════════════════════════════════════════════════════
        this.getMyStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const caller = await buildCallerContext(req);
            const pageStr = queryStr(req.query.page);
            const limitStr = queryStr(req.query.limit);
            const result = await statistics_service_1.statisticsService.getMyStatistics(caller, {
                page: pageStr ? Number(pageStr) : undefined,
                limit: limitStr ? Number(limitStr) : undefined,
            });
            (0, response_util_1.sendSuccess)(res, result, 'Your statistics retrieved');
        });
    }
}
exports.StatisticsController = StatisticsController;
exports.statisticsController = new StatisticsController();
//# sourceMappingURL=statistics.controller.js.map