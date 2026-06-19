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

// ─── Admin — System-wide ────────────────────────────────────────────────────
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

// ─── Branch — admin (truyền branchId), branch_manager, staff (giới hạn) ───────
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

// ─── Personal — mọi role đã đăng nhập ─────────────────────────────────────────
router.get('/me', validate(myStatsQuerySchema), statisticsController.getMyStatistics);

export default router;