"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statistics_controller_1 = require("./statistics.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const statistics_validation_1 = require("./statistics.validation");
const router = (0, express_1.Router)();
// Tất cả routes thống kê đều yêu cầu đăng nhập
router.use(auth_middleware_1.authenticate);
// ─── DASHBOARDS BY ROLE ───────────────────────────────────────────────────────
router.get('/admin/dashboard', (0, role_middleware_1.authorize)('admin'), (0, statistics_validation_1.validate)(statistics_validation_1.trendQuerySchema), statistics_controller_1.statisticsController.getAdminDashboard);
router.get('/branch/dashboard', (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, statistics_validation_1.validate)(statistics_validation_1.branchTrendQuerySchema), statistics_controller_1.statisticsController.getBranchDashboard);
router.get('/staff/dashboard', (0, role_middleware_1.authorize)('staff'), (0, statistics_validation_1.validate)(statistics_validation_1.trendQuerySchema), statistics_controller_1.statisticsController.getStaffDashboard);
router.get('/customer/dashboard', (0, role_middleware_1.authorize)('customer'), (0, statistics_validation_1.validate)(statistics_validation_1.trendQuerySchema), statistics_controller_1.statisticsController.getCustomerDashboard);
// ─── LEGACY ROUTES (Preserved for compatibility) ──────────────────────────────
router.get('/admin/overview', (0, role_middleware_1.authorize)('admin'), statistics_controller_1.statisticsController.getAdminOverview);
router.get('/admin/users/trend', (0, role_middleware_1.authorize)('admin'), (0, statistics_validation_1.validate)(statistics_validation_1.trendQuerySchema), statistics_controller_1.statisticsController.getUserRegistrationTrend);
router.get('/admin/promotions/top', (0, role_middleware_1.authorize)('admin'), (0, statistics_validation_1.validate)(statistics_validation_1.topPromotionsQuerySchema), statistics_controller_1.statisticsController.getTopPromotions);
router.get('/admin/vouchers/trend', (0, role_middleware_1.authorize)('admin'), (0, statistics_validation_1.validate)(statistics_validation_1.trendQuerySchema), statistics_controller_1.statisticsController.getVoucherUsageTrend);
router.get('/branch/overview', (0, role_middleware_1.authorize)('admin', 'branch_manager', 'staff'), (0, statistics_validation_1.validate)(statistics_validation_1.branchOverviewQuerySchema), statistics_controller_1.statisticsController.getBranchOverview);
router.get('/branch/vouchers/trend', (0, role_middleware_1.authorize)('admin', 'branch_manager'), (0, statistics_validation_1.validate)(statistics_validation_1.branchTrendQuerySchema), statistics_controller_1.statisticsController.getBranchVoucherUsageTrend);
router.get('/me', (0, statistics_validation_1.validate)(statistics_validation_1.myStatsQuerySchema), statistics_controller_1.statisticsController.getMyStatistics);
exports.default = router;
//# sourceMappingURL=statistics.routes.js.map