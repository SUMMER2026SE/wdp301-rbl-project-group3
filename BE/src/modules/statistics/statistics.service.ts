import { Types } from 'mongoose';
import { statisticsRepository, GroupBy, DateRange } from './statistics.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { UserRole } from '../../types/common.types';

export interface CallerContext {
  userId: string;
  role: UserRole;
  branchId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_RANGE_DAYS = 366;
const DEFAULT_RANGE_DAYS = 30;

function resolveDateRange(from?: string, to?: string, groupBy?: GroupBy): DateRange {
  const now = new Date();
  const toDate = to ? new Date(to) : now;

  let fromDate: Date;
  if (from) {
    fromDate = new Date(from);
  } else {
    fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - DEFAULT_RANGE_DAYS);
  }

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new AppError('Invalid date format. Use ISO 8601 (e.g. 2026-01-01)', 400);
  }

  if (fromDate > toDate) {
    throw new AppError('"from" date must be before or equal to "to" date', 400);
  }

  const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > MAX_RANGE_DAYS) {
    throw new AppError(`Date range cannot exceed ${MAX_RANGE_DAYS} days`, 400);
  }

  // Bao trọn ngày "to" (đến 23:59:59.999)
  const toDateEnd = new Date(toDate);
  toDateEnd.setHours(23, 59, 59, 999);

  return { from: fromDate, to: toDateEnd, groupBy: groupBy ?? 'day' };
}

function calcUsageRate(byStatus: Record<string, number>): {
  total: number;
  used: number;
  active: number;
  expired: number;
  disabled: number;
  usageRatePercent: number;
} {
  const used = byStatus.used ?? 0;
  const active = byStatus.active ?? 0;
  const expired = byStatus.expired ?? 0;
  const disabled = byStatus.disabled ?? 0;
  const total = used + active + expired + disabled;

  return {
    total,
    used,
    active,
    expired,
    disabled,
    usageRatePercent: total > 0 ? Math.round((used / total) * 10000) / 100 : 0,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class StatisticsService {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN — System-wide overview
  // ═══════════════════════════════════════════════════════════════════════════

  async getAdminOverview(caller: CallerContext) {
    this.assertRole(caller, ['admin']);

    const [
      totalUsers,
      usersByRole,
      usersByStatus,
      usersByAuthProvider,
      emailVerification,
      totalPromotions,
      promotionsByStatus,
      promotionsByScope,
      totalVouchers,
      vouchersByStatus,
    ] = await Promise.all([
      statisticsRepository.getTotalUsers(),
      statisticsRepository.countUsersByRole(),
      statisticsRepository.countUsersByStatus(),
      statisticsRepository.countUsersByAuthProvider(),
      statisticsRepository.countVerifiedUsers(),
      statisticsRepository.getTotalPromotions(),
      statisticsRepository.countPromotionsByStatus(),
      statisticsRepository.countPromotionsByScope(),
      statisticsRepository.getTotalVouchers(),
      statisticsRepository.countVouchersByStatus(),
    ]);

    return {
      users: {
        total: totalUsers,
        byRole: usersByRole,
        byStatus: usersByStatus,
        byAuthProvider: usersByAuthProvider,
        emailVerification,
      },
      promotions: {
        total: totalPromotions,
        byStatus: promotionsByStatus,
        byScope: promotionsByScope,
      },
      vouchers: calcUsageRate(vouchersByStatus),
      generatedAt: new Date(),
    };
  }

  // ── User registration trend ──────────────────────────────────────────────
  async getUserRegistrationTrend(
    caller: CallerContext,
    params: { from?: string; to?: string; groupBy?: GroupBy }
  ) {
    this.assertRole(caller, ['admin']);

    const range = resolveDateRange(params.from, params.to, params.groupBy);
    const [trend, newUsersTotal] = await Promise.all([
      statisticsRepository.userRegistrationTrend(range),
      statisticsRepository.countNewUsers(range.from, range.to),
    ]);

    return {
      range: { from: range.from, to: range.to, groupBy: range.groupBy },
      totalNewUsers: newUsersTotal,
      trend,
    };
  }

  // ── Top promotions by usage (system-wide) ────────────────────────────────
  async getTopPromotions(caller: CallerContext, limit: number) {
    this.assertRole(caller, ['admin']);

    const top = await statisticsRepository.topPromotionsByUsage(limit);
    const promotionIds = top.map((p) => new Types.ObjectId(p.id));
    const voucherBreakdown = await statisticsRepository.countVouchersByStatusForPromotions(
      promotionIds
    );

    return {
      data: top.map((p) => ({
        ...p,
        vouchers: calcUsageRate(voucherBreakdown[p.id] ?? {}),
      })),
    };
  }

  // ── Voucher usage trend (system-wide) ────────────────────────────────────
  async getVoucherUsageTrend(
    caller: CallerContext,
    params: { from?: string; to?: string; groupBy?: GroupBy }
  ) {
    this.assertRole(caller, ['admin']);

    const range = resolveDateRange(params.from, params.to, params.groupBy);
    const trend = await statisticsRepository.voucherUsageTrend(range);

    return { range: { from: range.from, to: range.to, groupBy: range.groupBy }, trend };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BRANCH MANAGER / ADMIN (with branchId) / STAFF (limited) — Branch overview
  // ═══════════════════════════════════════════════════════════════════════════

  async getBranchOverview(caller: CallerContext, requestedBranchId?: string) {
    this.assertRole(caller, ['admin', 'branch_manager', 'staff']);

    const branchId = this.resolveBranchId(caller, requestedBranchId);
    const branchObjectId = new Types.ObjectId(branchId);
    const promotionMatch = { branchId: branchObjectId };
    const voucherMatch = { branchId: branchObjectId };

    const [promotionsByStatus, vouchersByStatus, topPromotions] = await Promise.all([
      statisticsRepository.countPromotionsByStatus(promotionMatch),
      statisticsRepository.countVouchersByStatus(voucherMatch),
      statisticsRepository.topPromotionsByUsage(5, promotionMatch),
    ]);

    const base = {
      branchId,
      promotions: {
        total: Object.values(promotionsByStatus).reduce((a, b) => a + b, 0),
        byStatus: promotionsByStatus,
      },
      vouchers: calcUsageRate(vouchersByStatus),
      topPromotions: topPromotions.map((p) => ({
        id: p.id,
        name: p.name,
        discountType: p.discountType,
        discountValue: p.discountValue,
        status: p.status,
        usageCount: p.usageCount,
      })),
      generatedAt: new Date(),
    };

    // staff chỉ xem được thống kê promotion/voucher, không xem được thống kê nhân sự
    if (caller.role === 'staff') {
      return base;
    }

    // admin & branch_manager: bổ sung thống kê nhân sự của branch
    const usersByRole = await statisticsRepository.countUsersByBranch(branchId);

    return {
      ...base,
      staffing: {
        byRole: usersByRole,
        total: Object.values(usersByRole).reduce((a, b) => a + b, 0),
      },
    };
  }

  // ── Branch voucher usage trend ───────────────────────────────────────────
  async getBranchVoucherUsageTrend(
    caller: CallerContext,
    requestedBranchId: string | undefined,
    params: { from?: string; to?: string; groupBy?: GroupBy }
  ) {
    this.assertRole(caller, ['admin', 'branch_manager']);

    const branchId = this.resolveBranchId(caller, requestedBranchId);
    const range = resolveDateRange(params.from, params.to, params.groupBy);

    const trend = await statisticsRepository.voucherUsageTrend(range, {
      branchId: new Types.ObjectId(branchId),
    });

    return {
      branchId,
      range: { from: range.from, to: range.to, groupBy: range.groupBy },
      trend,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSONAL (mọi role) — /me
  // ═══════════════════════════════════════════════════════════════════════════

  async getMyStatistics(
    caller: CallerContext,
    params: { page?: number; limit?: number }
  ) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 10, 50);

    const [vouchersUsedCount, recentVouchers] = await Promise.all([
      statisticsRepository.countVouchersUsedByUser(caller.userId),
      statisticsRepository.listVouchersUsedByUser(caller.userId, page, limit),
    ]);

    return {
      vouchersUsed: {
        total: vouchersUsedCount,
        recent: recentVouchers.data,
        pagination: {
          total: recentVouchers.total,
          page,
          limit,
          totalPages: Math.ceil(recentVouchers.total / limit),
        },
      },
    };
  }

  // ─── Internal helpers ────────────────────────────────────────────────────

  private assertRole(caller: CallerContext, allowed: UserRole[]): void {
    if (!allowed.includes(caller.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
  }

  /**
   * Xác định branchId thực sự sẽ dùng để truy vấn:
   * - admin: có thể chỉ định bất kỳ branchId (bắt buộc truyền vào)
   * - branch_manager / staff: luôn dùng branchId của chính mình, không cho chỉ định branch khác
   */
  private resolveBranchId(caller: CallerContext, requestedBranchId?: string): string {
    if (caller.role === 'admin') {
      if (!requestedBranchId) {
        throw new AppError('branchId is required for admin to view branch statistics', 400);
      }
      return requestedBranchId;
    }

    // branch_manager / staff
    if (!caller.branchId) {
      throw new AppError('Your account is not assigned to any branch', 400);
    }

    if (requestedBranchId && requestedBranchId !== caller.branchId) {
      throw new AppError('You can only view statistics of your own branch', 403);
    }

    return caller.branchId;
  }
}

export const statisticsService = new StatisticsService();