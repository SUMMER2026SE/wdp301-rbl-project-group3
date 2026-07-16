import { Types } from 'mongoose';
export type GroupBy = 'day' | 'month';
export interface DateRange {
    from: Date;
    to: Date;
    groupBy: GroupBy;
}
export interface TrendPoint {
    date: string;
    count: number;
}
export interface RevenueTrendPoint {
    date: string;
    revenue: number;
    count: number;
}
export interface TopPromotionItem {
    id: string;
    name: string;
    discountType: string;
    discountValue: number;
    status: string;
    usageCount: number;
    usageLimit?: number;
}
export interface UsedVoucherItem {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    usedAt?: Date;
}
export interface UsedVoucherListResult {
    data: UsedVoucherItem[];
    total: number;
}
export declare class StatisticsRepository {
    getTotalUsers(match?: Record<string, unknown>): Promise<number>;
    countUsersByRole(match?: Record<string, unknown>): Promise<Record<string, number>>;
    countUsersByStatus(match?: Record<string, unknown>): Promise<Record<string, number>>;
    countUsersByAuthProvider(match?: Record<string, unknown>): Promise<Record<string, number>>;
    countVerifiedUsers(match?: Record<string, unknown>): Promise<{
        verified: number;
        unverified: number;
    }>;
    userRegistrationTrend(range: DateRange): Promise<TrendPoint[]>;
    countNewUsers(from: Date, to: Date, match?: Record<string, unknown>): Promise<number>;
    countUsersByBranch(branchId: string): Promise<Record<string, number>>;
    getTotalPromotions(match?: Record<string, unknown>): Promise<number>;
    countPromotionsByStatus(match?: Record<string, unknown>): Promise<Record<string, number>>;
    countPromotionsByScope(match?: Record<string, unknown>): Promise<Record<string, number>>;
    countPromotionsByDiscountType(match?: Record<string, unknown>): Promise<Record<string, number>>;
    topPromotionsByUsage(limit: number, match?: Record<string, unknown>): Promise<TopPromotionItem[]>;
    promotionCreationTrend(range: DateRange, match?: Record<string, unknown>): Promise<TrendPoint[]>;
    getTotalVouchers(match?: Record<string, unknown>): Promise<number>;
    countVouchersByStatus(match?: Record<string, unknown>): Promise<Record<string, number>>;
    countVouchersByStatusForPromotions(promotionIds: Types.ObjectId[]): Promise<Record<string, Record<string, number>>>;
    voucherUsageTrend(range: DateRange, match?: Record<string, unknown>): Promise<TrendPoint[]>;
    getPromotionRevenue(match?: Record<string, unknown>): Promise<number>;
    countVouchersUsedByUser(userId: string): Promise<number>;
    listVouchersUsedByUser(userId: string, page: number, limit: number): Promise<UsedVoucherListResult>;
    getTotalBranches(match?: Record<string, unknown>): Promise<number>;
    getTotalProducts(match?: Record<string, unknown>): Promise<number>;
    getTotalOrders(match?: Record<string, unknown>): Promise<number>;
    getTotalRevenue(match?: Record<string, unknown>): Promise<number>;
    getRevenueTrend(range: DateRange, match?: Record<string, unknown>): Promise<RevenueTrendPoint[]>;
    getRevenueByBranch(match?: Record<string, unknown>): Promise<any[]>;
    getTopSellingProducts(limit: number, match?: Record<string, unknown>): Promise<any[]>;
    getLowStockProducts(limit: number, match?: Record<string, unknown>): Promise<any[]>;
    getInventoryStats(match?: Record<string, unknown>): Promise<{
        totalQuantity: number;
        totalValue: number;
    }>;
    getTopCustomers(limit: number, match?: Record<string, unknown>): Promise<any[]>;
    getTopStaff(limit: number, match?: Record<string, unknown>): Promise<any[]>;
    countServedCustomers(match?: Record<string, unknown>): Promise<number>;
}
export declare const statisticsRepository: StatisticsRepository;
//# sourceMappingURL=statistics.repository.d.ts.map