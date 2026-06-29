import { Router } from 'express';
import { statisticsController } from './statistics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
  validate,
  trendQuerySchema,
  topPromotionsQuerySchema,
  branchOverviewQuerySchema,
  branchTrendQuerySchema,
  myStatsQuerySchema,
} from './statistics.validation';

const router = Router();

// Tất cả routes thống kê đều yêu cầu đăng nhập
router.use(authenticate);

// ─── DASHBOARDS BY ROLE ───────────────────────────────────────────────────────

router.get(
  '/admin/dashboard',
  authorize('admin'),
  validate(trendQuerySchema),
  statisticsController.getAdminDashboard
);

router.get(
  '/branch/dashboard',
  authorize('admin', 'branch_manager'),
  validate(branchTrendQuerySchema),
  statisticsController.getBranchDashboard
);

router.get(
  '/staff/dashboard',
  authorize('staff'),
  validate(trendQuerySchema),
  statisticsController.getStaffDashboard
);

router.get(
  '/customer/dashboard',
  authorize('customer'),
  validate(trendQuerySchema),
  statisticsController.getCustomerDashboard
);

// ─── LEGACY ROUTES (Preserved for compatibility) ──────────────────────────────

router.get('/admin/overview', authorize('admin'), statisticsController.getAdminOverview);

router.get(
  '/admin/users/trend',
  authorize('admin'),
  validate(trendQuerySchema),
  statisticsController.getUserRegistrationTrend
);

router.get(
  '/admin/promotions/top',
  authorize('admin'),
  validate(topPromotionsQuerySchema),
  statisticsController.getTopPromotions
);

router.get(
  '/admin/vouchers/trend',
  authorize('admin'),
  validate(trendQuerySchema),
  statisticsController.getVoucherUsageTrend
);

router.get(
  '/branch/overview',
  authorize('admin', 'branch_manager', 'staff'),
  validate(branchOverviewQuerySchema),
  statisticsController.getBranchOverview
);

router.get(
  '/branch/vouchers/trend',
  authorize('admin', 'branch_manager'),
  validate(branchTrendQuerySchema),
  statisticsController.getBranchVoucherUsageTrend
);

router.get('/me', validate(myStatsQuerySchema), statisticsController.getMyStatistics);

export default router;
