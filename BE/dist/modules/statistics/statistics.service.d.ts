import { GroupBy } from './statistics.repository';
import { UserRole } from '../../types/common.types';
export interface CallerContext {
    userId: string;
    role: UserRole;
    branchId?: string;
}
export declare class StatisticsService {
    getAdminDashboard(caller: CallerContext, params: {
        from?: string;
        to?: string;
        groupBy?: GroupBy;
    }): Promise<{
        cards: {
            totalBranches: number;
            totalStaff: number;
            totalCustomers: number;
            totalProducts: number;
            totalOrders: number;
            totalRevenue: number;
            promotionRevenue: number;
            vouchersUsed: number;
            totalInventoryValue: number;
            totalInventoryQuantity: number;
        };
        charts: {
            revenueTrend: {
                range: {
                    from: Date;
                    to: Date;
                    groupBy: GroupBy;
                };
                data: import("./statistics.repository").RevenueTrendPoint[];
            };
            revenueByBranch: any[];
            userRegistrationTrend: {
                range: {
                    from: Date;
                    to: Date;
                    groupBy: GroupBy;
                };
                data: import("./statistics.repository").TrendPoint[];
            };
        };
        lists: {
            topSellingProducts: any[];
            lowStockProducts: any[];
            topCustomers: any[];
            topStaff: any[];
        };
        generatedAt: Date;
    }>;
    getBranchDashboard(caller: CallerContext, requestedBranchId?: string, params?: {
        from?: string;
        to?: string;
        groupBy?: GroupBy;
    }): Promise<{
        cards: {
            totalStaff: number;
            totalCustomers: number;
            totalProducts: number;
            totalOrders: number;
            totalRevenue: number;
            promotionRevenue: number;
            vouchersUsed: number;
            totalInventoryValue: number;
            totalInventoryQuantity: number;
        };
        charts: {
            revenueTrend: {
                range: {
                    from: Date;
                    to: Date;
                    groupBy: GroupBy;
                };
                data: import("./statistics.repository").RevenueTrendPoint[];
            };
        };
        lists: {
            topSellingProducts: any[];
            lowStockProducts: any[];
            topCustomers: any[];
            topStaff: any[];
        };
        branchId: string;
        generatedAt: Date;
    }>;
    getStaffDashboard(caller: CallerContext, params?: {
        from?: string;
        to?: string;
        groupBy?: GroupBy;
    }): Promise<{
        cards: {
            totalProducts: number;
            totalInventoryQuantity: number;
            processedOrders: number;
            revenueGenerated: number;
            customersServed: number;
        };
        charts: {
            revenueTrend: {
                range: {
                    from: Date;
                    to: Date;
                    groupBy: GroupBy;
                };
                data: import("./statistics.repository").RevenueTrendPoint[];
            };
        };
        lists: {
            topSellingProductsBranch: any[];
            lowStockProductsBranch: any[];
        };
        generatedAt: Date;
    }>;
    getCustomerDashboard(caller: CallerContext, params?: {
        from?: string;
        to?: string;
        groupBy?: GroupBy;
    }): Promise<{
        cards: {
            totalOrders: number;
            totalSpent: number;
            averageOrderValue: number;
            totalVouchersUsed: number;
        };
        charts: {
            spendTrend: {
                range: {
                    from: Date;
                    to: Date;
                    groupBy: GroupBy;
                };
                data: import("./statistics.repository").RevenueTrendPoint[];
            };
        };
        lists: {
            topBoughtProducts: any[];
            recentVouchersUsed: import("./statistics.repository").UsedVoucherItem[];
        };
        generatedAt: Date;
    }>;
    getAdminOverview(caller: CallerContext): Promise<{
        users: {
            total: number;
            byRole: Record<string, number>;
            byStatus: Record<string, number>;
            byAuthProvider: Record<string, number>;
            emailVerification: {
                verified: number;
                unverified: number;
            };
        };
        promotions: {
            total: number;
            byStatus: Record<string, number>;
            byScope: Record<string, number>;
        };
        vouchers: {
            total: number;
            used: number;
            active: number;
            expired: number;
            disabled: number;
            usageRatePercent: number;
        };
        generatedAt: Date;
    }>;
    getUserRegistrationTrend(caller: CallerContext, params: {
        from?: string;
        to?: string;
        groupBy?: GroupBy;
    }): Promise<{
        range: {
            from: Date;
            to: Date;
            groupBy: GroupBy;
        };
        totalNewUsers: number;
        trend: import("./statistics.repository").TrendPoint[];
    }>;
    getTopPromotions(caller: CallerContext, limit: number): Promise<{
        data: {
            vouchers: {
                total: number;
                used: number;
                active: number;
                expired: number;
                disabled: number;
                usageRatePercent: number;
            };
            id: string;
            name: string;
            discountType: string;
            discountValue: number;
            status: string;
            usageCount: number;
            usageLimit?: number;
        }[];
    }>;
    getVoucherUsageTrend(caller: CallerContext, params: {
        from?: string;
        to?: string;
        groupBy?: GroupBy;
    }): Promise<{
        range: {
            from: Date;
            to: Date;
            groupBy: GroupBy;
        };
        trend: import("./statistics.repository").TrendPoint[];
    }>;
    getBranchOverview(caller: CallerContext, requestedBranchId?: string): Promise<{
        branchId: string;
        promotions: {
            total: number;
            byStatus: Record<string, number>;
        };
        vouchers: {
            total: number;
            used: number;
            active: number;
            expired: number;
            disabled: number;
            usageRatePercent: number;
        };
        topPromotions: {
            id: string;
            name: string;
            discountType: string;
            discountValue: number;
            status: string;
            usageCount: number;
        }[];
        generatedAt: Date;
    } | {
        staffing: {
            byRole: Record<string, number>;
            total: number;
        };
        branchId: string;
        promotions: {
            total: number;
            byStatus: Record<string, number>;
        };
        vouchers: {
            total: number;
            used: number;
            active: number;
            expired: number;
            disabled: number;
            usageRatePercent: number;
        };
        topPromotions: {
            id: string;
            name: string;
            discountType: string;
            discountValue: number;
            status: string;
            usageCount: number;
        }[];
        generatedAt: Date;
    }>;
    getBranchVoucherUsageTrend(caller: CallerContext, requestedBranchId: string | undefined, params: {
        from?: string;
        to?: string;
        groupBy?: GroupBy;
    }): Promise<{
        branchId: string;
        range: {
            from: Date;
            to: Date;
            groupBy: GroupBy;
        };
        trend: import("./statistics.repository").TrendPoint[];
    }>;
    getMyStatistics(caller: CallerContext, params: {
        page?: number;
        limit?: number;
    }): Promise<{
        vouchersUsed: {
            total: number;
            recent: import("./statistics.repository").UsedVoucherItem[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            };
        };
    }>;
    private assertRole;
    private resolveBranchId;
}
export declare const statisticsService: StatisticsService;
//# sourceMappingURL=statistics.service.d.ts.map