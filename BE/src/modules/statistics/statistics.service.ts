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
  // ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  async getAdminDashboard(
    caller: CallerContext,
    params: { from?: string; to?: string; groupBy?: GroupBy }
  ) {
    this.assertRole(caller, ['admin']);
    const range = resolveDateRange(params.from, params.to, params.groupBy);

    const [
      totalBranches,
      totalStaff,
      totalCustomers,
      totalProducts,
      totalOrders,
      totalRevenue,
      inventoryStats,
      revenueTrend,
      revenueByBranch,
      topSellingProducts,
      lowStockProducts,
      topCustomers,
      topStaff,
      userRegistrationTrend,
    ] = await Promise.all([
      statisticsRepository.getTotalBranches(),
      statisticsRepository.getTotalUsers({ role: { $in: ['staff', 'branch_manager'] } }),
      statisticsRepository.getTotalUsers({ role: 'customer' }),
      statisticsRepository.getTotalProducts(),
      statisticsRepository.getTotalOrders(),
      statisticsRepository.getTotalRevenue(),
      statisticsRepository.getInventoryStats(),
      statisticsRepository.getRevenueTrend(range),
      statisticsRepository.getRevenueByBranch(),
      statisticsRepository.getTopSellingProducts(5),
      statisticsRepository.getLowStockProducts(10),
      statisticsRepository.getTopCustomers(5),
      statisticsRepository.getTopStaff(5),
      statisticsRepository.userRegistrationTrend(range),
    ]);

    return {
      cards: {
        totalBranches,
        totalStaff,
        totalCustomers,
        totalProducts,
        totalOrders,
        totalRevenue,
        totalInventoryValue: inventoryStats.totalValue,
        totalInventoryQuantity: inventoryStats.totalQuantity,
      },
      charts: {
        revenueTrend: { range: { from: range.from, to: range.to, groupBy: range.groupBy }, data: revenueTrend },
        revenueByBranch,
        userRegistrationTrend: { range: { from: range.from, to: range.to, groupBy: range.groupBy }, data: userRegistrationTrend },
      },
      lists: {
        topSellingProducts,
        lowStockProducts,
        topCustomers,
        topStaff,
      },
      generatedAt: new Date(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BRANCH MANAGER DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  async getBranchDashboard(
    caller: CallerContext,
    requestedBranchId?: string,
    params: { from?: string; to?: string; groupBy?: GroupBy } = {}
  ) {
    this.assertRole(caller, ['admin', 'branch_manager']);
    const branchId = this.resolveBranchId(caller, requestedBranchId);
    const branchObjId = new Types.ObjectId(branchId);
    const range = resolveDateRange(params.from, params.to, params.groupBy);

    const branchMatch = { branchId: branchObjId };

    const [
      totalStaff,
      totalCustomers,
      totalProducts,
      totalOrders,
      totalRevenue,
      inventoryStats,
      revenueTrend,
      topSellingProducts,
      lowStockProducts,
      topCustomers,
      topStaff,
    ] = await Promise.all([
      statisticsRepository.getTotalUsers({ role: { $in: ['staff', 'branch_manager'] }, branchId: branchObjId }),
      statisticsRepository.countServedCustomers({ branchId: branchObjId }),
      statisticsRepository.getTotalProducts(branchMatch),
      statisticsRepository.getTotalOrders(branchMatch),
      statisticsRepository.getTotalRevenue(branchMatch),
      statisticsRepository.getInventoryStats(branchMatch),
      statisticsRepository.getRevenueTrend(range, branchMatch),
      statisticsRepository.getTopSellingProducts(5, branchMatch),
      statisticsRepository.getLowStockProducts(10, branchMatch),
      statisticsRepository.getTopCustomers(5, branchMatch),
      statisticsRepository.getTopStaff(5, branchMatch),
    ]);

    return {
      cards: {
        totalStaff,
        totalCustomers, // based on distinct customers in branch orders
        totalProducts, // number of distinct products in inventory
        totalOrders,
        totalRevenue,
        totalInventoryValue: inventoryStats.totalValue,
        totalInventoryQuantity: inventoryStats.totalQuantity,
      },
      charts: {
        revenueTrend: { range: { from: range.from, to: range.to, groupBy: range.groupBy }, data: revenueTrend },
      },
      lists: {
        topSellingProducts,
        lowStockProducts,
        topCustomers,
        topStaff,
      },
      branchId,
      generatedAt: new Date(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  async getStaffDashboard(
    caller: CallerContext,
    params: { from?: string; to?: string; groupBy?: GroupBy } = {}
  ) {
    this.assertRole(caller, ['staff']);
    if (!caller.branchId) {
      throw new AppError('Your account is not assigned to any branch', 400);
    }
    const branchObjId = new Types.ObjectId(caller.branchId);
    const userObjId = new Types.ObjectId(caller.userId);
    const range = resolveDateRange(params.from, params.to, params.groupBy);

    const branchMatch = { branchId: branchObjId };
    const staffMatch = { branchId: branchObjId, confirmedBy: userObjId };

    const [
      totalProducts,
      inventoryStats,
      processedOrders,
      revenueGenerated,
      customersServed,
      staffRevenueTrend,
      topSellingProductsBranch,
      lowStockProductsBranch,
    ] = await Promise.all([
      statisticsRepository.getTotalProducts(branchMatch),
      statisticsRepository.getInventoryStats(branchMatch),
      statisticsRepository.getTotalOrders(staffMatch),
      statisticsRepository.getTotalRevenue(staffMatch),
      statisticsRepository.countServedCustomers(staffMatch),
      statisticsRepository.getRevenueTrend(range, staffMatch),
      statisticsRepository.getTopSellingProducts(5, branchMatch),
      statisticsRepository.getLowStockProducts(10, branchMatch),
    ]);

    return {
      cards: {
        totalProducts,
        totalInventoryQuantity: inventoryStats.totalQuantity,
        processedOrders,
        revenueGenerated,
        customersServed,
      },
      charts: {
        revenueTrend: { range: { from: range.from, to: range.to, groupBy: range.groupBy }, data: staffRevenueTrend },
      },
      lists: {
        topSellingProductsBranch,
        lowStockProductsBranch,
      },
      generatedAt: new Date(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOMER DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  async getCustomerDashboard(
    caller: CallerContext,
    params: { from?: string; to?: string; groupBy?: GroupBy } = {}
  ) {
    this.assertRole(caller, ['customer']);
    const userObjId = new Types.ObjectId(caller.userId);
    const range = resolveDateRange(params.from, params.to, params.groupBy);

    const customerMatch = { customerId: userObjId };

    const [
      totalOrders,
      totalSpent,
      spendTrend,
      topBoughtProducts,
      vouchersUsedCount,
      recentVouchers,
    ] = await Promise.all([
      statisticsRepository.getTotalOrders(customerMatch),
      statisticsRepository.getTotalRevenue(customerMatch),
      statisticsRepository.getRevenueTrend(range, customerMatch),
      statisticsRepository.getTopSellingProducts(5, customerMatch), // Reusing top selling logic for personal items
      statisticsRepository.countVouchersUsedByUser(caller.userId),
      statisticsRepository.listVouchersUsedByUser(caller.userId, 1, 5),
    ]);

    return {
      cards: {
        totalOrders,
        totalSpent,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
        totalVouchersUsed: vouchersUsedCount,
      },
      charts: {
        spendTrend: { range: { from: range.from, to: range.to, groupBy: range.groupBy }, data: spendTrend },
      },
      lists: {
        topBoughtProducts,
        recentVouchersUsed: recentVouchers.data,
      },
      generatedAt: new Date(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY ENDPOINTS (Preserved for compatibility)
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

  async getVoucherUsageTrend(
    caller: CallerContext,
    params: { from?: string; to?: string; groupBy?: GroupBy }
  ) {
    this.assertRole(caller, ['admin']);

    const range = resolveDateRange(params.from, params.to, params.groupBy);
    const trend = await statisticsRepository.voucherUsageTrend(range);

    return { range: { from: range.from, to: range.to, groupBy: range.groupBy }, trend };
  }

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

    if (caller.role === 'staff') {
      return base;
    }

    const usersByRole = await statisticsRepository.countUsersByBranch(branchId);

    return {
      ...base,
      staffing: {
        byRole: usersByRole,
        total: Object.values(usersByRole).reduce((a, b) => a + b, 0),
      },
    };
  }

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

  private resolveBranchId(caller: CallerContext, requestedBranchId?: string): string {
    if (caller.role === 'admin') {
      if (!requestedBranchId) {
        throw new AppError('branchId is required for admin to view branch statistics', 400);
      }
      return requestedBranchId;
    }

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
