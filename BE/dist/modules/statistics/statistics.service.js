"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statisticsService = exports.StatisticsService = void 0;
const mongoose_1 = require("mongoose");
const statistics_repository_1 = require("./statistics.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
// ─── Helpers ──────────────────────────────────────────────────────────────────
const MAX_RANGE_DAYS = 366;
const DEFAULT_RANGE_DAYS = 30;
function resolveDateRange(from, to, groupBy) {
    const now = new Date();
    const toDate = to ? new Date(to) : now;
    let fromDate;
    if (from) {
        fromDate = new Date(from);
    }
    else {
        fromDate = new Date(toDate);
        fromDate.setDate(fromDate.getDate() - DEFAULT_RANGE_DAYS);
    }
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new errorHandler_middleware_1.AppError('Invalid date format. Use ISO 8601 (e.g. 2026-01-01)', 400);
    }
    if (fromDate > toDate) {
        throw new errorHandler_middleware_1.AppError('"from" date must be before or equal to "to" date', 400);
    }
    const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_RANGE_DAYS) {
        throw new errorHandler_middleware_1.AppError(`Date range cannot exceed ${MAX_RANGE_DAYS} days`, 400);
    }
    // Bao trọn ngày "to" (đến 23:59:59.999)
    const toDateEnd = new Date(toDate);
    toDateEnd.setHours(23, 59, 59, 999);
    return { from: fromDate, to: toDateEnd, groupBy: groupBy ?? 'day' };
}
function calcUsageRate(byStatus) {
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
class StatisticsService {
    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN DASHBOARD
    // ═══════════════════════════════════════════════════════════════════════════
    async getAdminDashboard(caller, params) {
        this.assertRole(caller, ['admin']);
        const range = resolveDateRange(params.from, params.to, params.groupBy);
        const [totalBranches, totalStaff, totalCustomers, totalProducts, totalOrders, totalRevenue, inventoryStats, revenueTrend, revenueByBranch, topSellingProducts, lowStockProducts, topCustomers, topStaff, userRegistrationTrend, promotionRevenue, vouchersByStatus,] = await Promise.all([
            statistics_repository_1.statisticsRepository.getTotalBranches(),
            statistics_repository_1.statisticsRepository.getTotalUsers({ role: { $in: ['staff', 'branch_manager'] } }),
            statistics_repository_1.statisticsRepository.getTotalUsers({ role: 'customer' }),
            statistics_repository_1.statisticsRepository.getTotalProducts(),
            statistics_repository_1.statisticsRepository.getTotalOrders(),
            statistics_repository_1.statisticsRepository.getTotalRevenue(),
            statistics_repository_1.statisticsRepository.getInventoryStats(),
            statistics_repository_1.statisticsRepository.getRevenueTrend(range),
            statistics_repository_1.statisticsRepository.getRevenueByBranch(),
            statistics_repository_1.statisticsRepository.getTopSellingProducts(5),
            statistics_repository_1.statisticsRepository.getLowStockProducts(10),
            statistics_repository_1.statisticsRepository.getTopCustomers(5),
            statistics_repository_1.statisticsRepository.getTopStaff(5),
            statistics_repository_1.statisticsRepository.userRegistrationTrend(range),
            statistics_repository_1.statisticsRepository.getPromotionRevenue(),
            statistics_repository_1.statisticsRepository.countVouchersByStatus(),
        ]);
        return {
            cards: {
                totalBranches,
                totalStaff,
                totalCustomers,
                totalProducts,
                totalOrders,
                totalRevenue,
                promotionRevenue,
                vouchersUsed: vouchersByStatus['used'] || 0,
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
    async getBranchDashboard(caller, requestedBranchId, params = {}) {
        this.assertRole(caller, ['admin', 'branch_manager']);
        const branchId = this.resolveBranchId(caller, requestedBranchId);
        const branchObjId = new mongoose_1.Types.ObjectId(branchId);
        const range = resolveDateRange(params.from, params.to, params.groupBy);
        const branchMatch = { branchId: branchObjId };
        const [totalStaff, totalCustomers, totalProducts, totalOrders, totalRevenue, inventoryStats, revenueTrend, topSellingProducts, lowStockProducts, topCustomers, topStaff, promotionRevenue, vouchersByStatus,] = await Promise.all([
            statistics_repository_1.statisticsRepository.getTotalUsers({ role: { $in: ['staff', 'branch_manager'] }, branchId: branchObjId }),
            statistics_repository_1.statisticsRepository.countServedCustomers({ branchId: branchObjId }),
            statistics_repository_1.statisticsRepository.getTotalProducts(branchMatch),
            statistics_repository_1.statisticsRepository.getTotalOrders(branchMatch),
            statistics_repository_1.statisticsRepository.getTotalRevenue(branchMatch),
            statistics_repository_1.statisticsRepository.getInventoryStats(branchMatch),
            statistics_repository_1.statisticsRepository.getRevenueTrend(range, branchMatch),
            statistics_repository_1.statisticsRepository.getTopSellingProducts(5, branchMatch),
            statistics_repository_1.statisticsRepository.getLowStockProducts(10, branchMatch),
            statistics_repository_1.statisticsRepository.getTopCustomers(5, branchMatch),
            statistics_repository_1.statisticsRepository.getTopStaff(5, branchMatch),
            statistics_repository_1.statisticsRepository.getPromotionRevenue(branchMatch),
            statistics_repository_1.statisticsRepository.countVouchersByStatus(branchMatch),
        ]);
        return {
            cards: {
                totalStaff,
                totalCustomers, // based on distinct customers in branch orders
                totalProducts, // number of distinct products in inventory
                totalOrders,
                totalRevenue,
                promotionRevenue,
                vouchersUsed: vouchersByStatus['used'] || 0,
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
    async getStaffDashboard(caller, params = {}) {
        this.assertRole(caller, ['staff']);
        if (!caller.branchId) {
            throw new errorHandler_middleware_1.AppError('Your account is not assigned to any branch', 400);
        }
        const branchObjId = new mongoose_1.Types.ObjectId(caller.branchId);
        const userObjId = new mongoose_1.Types.ObjectId(caller.userId);
        const range = resolveDateRange(params.from, params.to, params.groupBy);
        const branchMatch = { branchId: branchObjId };
        const staffMatch = { branchId: branchObjId, confirmedBy: userObjId };
        const [totalProducts, inventoryStats, processedOrders, revenueGenerated, customersServed, staffRevenueTrend, topSellingProductsBranch, lowStockProductsBranch,] = await Promise.all([
            statistics_repository_1.statisticsRepository.getTotalProducts(branchMatch),
            statistics_repository_1.statisticsRepository.getInventoryStats(branchMatch),
            statistics_repository_1.statisticsRepository.getTotalOrders(staffMatch),
            statistics_repository_1.statisticsRepository.getTotalRevenue(staffMatch),
            statistics_repository_1.statisticsRepository.countServedCustomers(staffMatch),
            statistics_repository_1.statisticsRepository.getRevenueTrend(range, staffMatch),
            statistics_repository_1.statisticsRepository.getTopSellingProducts(5, branchMatch),
            statistics_repository_1.statisticsRepository.getLowStockProducts(10, branchMatch),
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
    async getCustomerDashboard(caller, params = {}) {
        this.assertRole(caller, ['customer']);
        const userObjId = new mongoose_1.Types.ObjectId(caller.userId);
        const range = resolveDateRange(params.from, params.to, params.groupBy);
        const customerMatch = { customerId: userObjId };
        const [totalOrders, totalSpent, spendTrend, topBoughtProducts, vouchersUsedCount, recentVouchers,] = await Promise.all([
            statistics_repository_1.statisticsRepository.getTotalOrders(customerMatch),
            statistics_repository_1.statisticsRepository.getTotalRevenue(customerMatch),
            statistics_repository_1.statisticsRepository.getRevenueTrend(range, customerMatch),
            statistics_repository_1.statisticsRepository.getTopSellingProducts(5, customerMatch), // Reusing top selling logic for personal items
            statistics_repository_1.statisticsRepository.countVouchersUsedByUser(caller.userId),
            statistics_repository_1.statisticsRepository.listVouchersUsedByUser(caller.userId, 1, 5),
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
    async getAdminOverview(caller) {
        this.assertRole(caller, ['admin']);
        const [totalUsers, usersByRole, usersByStatus, usersByAuthProvider, emailVerification, totalPromotions, promotionsByStatus, promotionsByScope, totalVouchers, vouchersByStatus,] = await Promise.all([
            statistics_repository_1.statisticsRepository.getTotalUsers(),
            statistics_repository_1.statisticsRepository.countUsersByRole(),
            statistics_repository_1.statisticsRepository.countUsersByStatus(),
            statistics_repository_1.statisticsRepository.countUsersByAuthProvider(),
            statistics_repository_1.statisticsRepository.countVerifiedUsers(),
            statistics_repository_1.statisticsRepository.getTotalPromotions(),
            statistics_repository_1.statisticsRepository.countPromotionsByStatus(),
            statistics_repository_1.statisticsRepository.countPromotionsByScope(),
            statistics_repository_1.statisticsRepository.getTotalVouchers(),
            statistics_repository_1.statisticsRepository.countVouchersByStatus(),
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
    async getUserRegistrationTrend(caller, params) {
        this.assertRole(caller, ['admin']);
        const range = resolveDateRange(params.from, params.to, params.groupBy);
        const [trend, newUsersTotal] = await Promise.all([
            statistics_repository_1.statisticsRepository.userRegistrationTrend(range),
            statistics_repository_1.statisticsRepository.countNewUsers(range.from, range.to),
        ]);
        return {
            range: { from: range.from, to: range.to, groupBy: range.groupBy },
            totalNewUsers: newUsersTotal,
            trend,
        };
    }
    async getTopPromotions(caller, limit) {
        this.assertRole(caller, ['admin']);
        const top = await statistics_repository_1.statisticsRepository.topPromotionsByUsage(limit);
        const promotionIds = top.map((p) => new mongoose_1.Types.ObjectId(p.id));
        const voucherBreakdown = await statistics_repository_1.statisticsRepository.countVouchersByStatusForPromotions(promotionIds);
        return {
            data: top.map((p) => ({
                ...p,
                vouchers: calcUsageRate(voucherBreakdown[p.id] ?? {}),
            })),
        };
    }
    async getVoucherUsageTrend(caller, params) {
        this.assertRole(caller, ['admin']);
        const range = resolveDateRange(params.from, params.to, params.groupBy);
        const trend = await statistics_repository_1.statisticsRepository.voucherUsageTrend(range);
        return { range: { from: range.from, to: range.to, groupBy: range.groupBy }, trend };
    }
    async getBranchOverview(caller, requestedBranchId) {
        this.assertRole(caller, ['admin', 'branch_manager', 'staff']);
        const branchId = this.resolveBranchId(caller, requestedBranchId);
        const branchObjectId = new mongoose_1.Types.ObjectId(branchId);
        const promotionMatch = { branchId: branchObjectId };
        const voucherMatch = { branchId: branchObjectId };
        const [promotionsByStatus, vouchersByStatus, topPromotions] = await Promise.all([
            statistics_repository_1.statisticsRepository.countPromotionsByStatus(promotionMatch),
            statistics_repository_1.statisticsRepository.countVouchersByStatus(voucherMatch),
            statistics_repository_1.statisticsRepository.topPromotionsByUsage(5, promotionMatch),
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
        const usersByRole = await statistics_repository_1.statisticsRepository.countUsersByBranch(branchId);
        return {
            ...base,
            staffing: {
                byRole: usersByRole,
                total: Object.values(usersByRole).reduce((a, b) => a + b, 0),
            },
        };
    }
    async getBranchVoucherUsageTrend(caller, requestedBranchId, params) {
        this.assertRole(caller, ['admin', 'branch_manager']);
        const branchId = this.resolveBranchId(caller, requestedBranchId);
        const range = resolveDateRange(params.from, params.to, params.groupBy);
        const trend = await statistics_repository_1.statisticsRepository.voucherUsageTrend(range, {
            branchId: new mongoose_1.Types.ObjectId(branchId),
        });
        return {
            branchId,
            range: { from: range.from, to: range.to, groupBy: range.groupBy },
            trend,
        };
    }
    async getMyStatistics(caller, params) {
        const page = params.page ?? 1;
        const limit = Math.min(params.limit ?? 10, 50);
        const [vouchersUsedCount, recentVouchers] = await Promise.all([
            statistics_repository_1.statisticsRepository.countVouchersUsedByUser(caller.userId),
            statistics_repository_1.statisticsRepository.listVouchersUsedByUser(caller.userId, page, limit),
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
    assertRole(caller, allowed) {
        if (!allowed.includes(caller.role)) {
            throw new errorHandler_middleware_1.AppError('Insufficient permissions', 403);
        }
    }
    resolveBranchId(caller, requestedBranchId) {
        if (caller.role === 'admin') {
            if (!requestedBranchId) {
                throw new errorHandler_middleware_1.AppError('branchId is required for admin to view branch statistics', 400);
            }
            return requestedBranchId;
        }
        if (!caller.branchId) {
            throw new errorHandler_middleware_1.AppError('Your account is not assigned to any branch', 400);
        }
        if (requestedBranchId && requestedBranchId !== caller.branchId) {
            throw new errorHandler_middleware_1.AppError('You can only view statistics of your own branch', 403);
        }
        return caller.branchId;
    }
}
exports.StatisticsService = StatisticsService;
exports.statisticsService = new StatisticsService();
//# sourceMappingURL=statistics.service.js.map