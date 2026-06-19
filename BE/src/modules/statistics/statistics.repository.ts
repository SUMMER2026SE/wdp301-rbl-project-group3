import { Types } from 'mongoose';
import { User } from '../../models/user.model';
import { Promotion } from '../../models/promotion.model';
import { Voucher, VoucherStatus } from '../../models/voucher.model';
import { Order } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { Inventory } from '../../models/inventory.model';
import { Branch } from '../../models/branch.model';

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

function dateFormat(groupBy: GroupBy): string {
  return groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
}

// ─── Generic count-by-field helper ────────────────────────────────────────────
async function countByField(
  model: any,
  field: string,
  match: Record<string, unknown>
): Promise<Record<string, number>> {
  const rows = await model
    .aggregate([{ $match: match }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }])
    .exec();

  const result: Record<string, number> = {};
  for (const row of rows) {
    const key = row._id ?? 'unknown';
    result[key] = row.count;
  }
  return result;
}

export class StatisticsRepository {
  // ═══════════════════════════════════════════════════════════════════════════
  // USER STATISTICS (admin)
  // ═══════════════════════════════════════════════════════════════════════════

  async getTotalUsers(match: Record<string, unknown> = {}): Promise<number> {
    return User.countDocuments(match).exec();
  }

  async countUsersByRole(match: Record<string, unknown> = {}): Promise<Record<string, number>> {
    return countByField(User, 'role', match);
  }

  async countUsersByStatus(match: Record<string, unknown> = {}): Promise<Record<string, number>> {
    return countByField(User, 'status', match);
  }

  async countUsersByAuthProvider(
    match: Record<string, unknown> = {}
  ): Promise<Record<string, number>> {
    return countByField(User, 'authProvider', match);
  }

  async countVerifiedUsers(
    match: Record<string, unknown> = {}
  ): Promise<{ verified: number; unverified: number }> {
    const verified = await User.countDocuments({ ...match, isEmailVerified: true }).exec();
    const unverified = await User.countDocuments({ ...match, isEmailVerified: false }).exec();
    return { verified, unverified };
  }

  async userRegistrationTrend(range: DateRange): Promise<TrendPoint[]> {
    const rows = await User.aggregate([
      { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat(range.groupBy), date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    const result: TrendPoint[] = [];
    for (const row of rows) {
      result.push({ date: row._id, count: row.count });
    }
    return result;
  }

  async countNewUsers(
    from: Date,
    to: Date,
    match: Record<string, unknown> = {}
  ): Promise<number> {
    return User.countDocuments({ ...match, createdAt: { $gte: from, $lte: to } }).exec();
  }

  async countUsersByBranch(branchId: string): Promise<Record<string, number>> {
    return countByField(User, 'role', { branchId: new Types.ObjectId(branchId) });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROMOTION STATISTICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getTotalPromotions(match: Record<string, unknown> = {}): Promise<number> {
    return Promotion.countDocuments(match).exec();
  }

  async countPromotionsByStatus(
    match: Record<string, unknown> = {}
  ): Promise<Record<string, number>> {
    return countByField(Promotion, 'status', match);
  }

  async countPromotionsByScope(
    match: Record<string, unknown> = {}
  ): Promise<Record<string, number>> {
    return countByField(Promotion, 'scope', match);
  }

  async countPromotionsByDiscountType(
    match: Record<string, unknown> = {}
  ): Promise<Record<string, number>> {
    return countByField(Promotion, 'discountType', match);
  }

  async topPromotionsByUsage(
    limit: number,
    match: Record<string, unknown> = {}
  ): Promise<TopPromotionItem[]> {
    const docs = await Promotion.find(match)
      .sort({ usageCount: -1 })
      .limit(limit)
      .select('name discountType discountValue status usageCount usageLimit')
      .exec();

    const result: TopPromotionItem[] = [];
    for (const p of docs) {
      result.push({
        id: p._id.toString(),
        name: p.name,
        discountType: p.discountType,
        discountValue: p.discountValue,
        status: p.status,
        usageCount: p.usageCount,
        usageLimit: p.usageLimit,
      });
    }
    return result;
  }

  async promotionCreationTrend(
    range: DateRange,
    match: Record<string, unknown> = {}
  ): Promise<TrendPoint[]> {
    const rows = await Promotion.aggregate([
      { $match: { ...match, createdAt: { $gte: range.from, $lte: range.to } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat(range.groupBy), date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    const result: TrendPoint[] = [];
    for (const row of rows) {
      result.push({ date: row._id, count: row.count });
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VOUCHER STATISTICS
  // ═══════════════════════════════════════════════════════════════════════════

  async getTotalVouchers(match: Record<string, unknown> = {}): Promise<number> {
    return Voucher.countDocuments(match).exec();
  }

  async countVouchersByStatus(
    match: Record<string, unknown> = {}
  ): Promise<Record<string, number>> {
    return countByField(Voucher, 'status', match);
  }

  async countVouchersByStatusForPromotions(
    promotionIds: Types.ObjectId[]
  ): Promise<Record<string, Record<string, number>>> {
    const rows = await Voucher.aggregate([
      { $match: { promotionId: { $in: promotionIds } } },
      {
        $group: {
          _id: { promotionId: '$promotionId', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const result: Record<string, Record<string, number>> = {};
    for (const row of rows) {
      const pid = row._id.promotionId.toString();
      if (!result[pid]) result[pid] = {};
      result[pid][row._id.status] = row.count;
    }
    return result;
  }

  async voucherUsageTrend(
    range: DateRange,
    match: Record<string, unknown> = {}
  ): Promise<TrendPoint[]> {
    const rows = await Voucher.aggregate([
      {
        $match: {
          ...match,
          status: 'used',
          usedAt: { $gte: range.from, $lte: range.to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat(range.groupBy), date: '$usedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    const result: TrendPoint[] = [];
    for (const row of rows) {
      result.push({ date: row._id, count: row.count });
    }
    return result;
  }

  // ─── Personal voucher stats (cho /me) ─────────────────────────────────────

  async countVouchersUsedByUser(userId: string): Promise<number> {
    const status: VoucherStatus = 'used';
    return Voucher.countDocuments({
      usedBy: new Types.ObjectId(userId),
      status,
    }).exec();
  }

  async listVouchersUsedByUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<UsedVoucherListResult> {
    const skip = (page - 1) * limit;
    const status: VoucherStatus = 'used';
    const filter = { usedBy: new Types.ObjectId(userId), status };

    const docs = await Voucher.find(filter)
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('code discountType discountValue usedAt')
      .exec();

    const total = await Voucher.countDocuments(filter).exec();

    const data: UsedVoucherItem[] = [];
    for (const v of docs) {
      data.push({
        id: v._id.toString(),
        code: v.code,
        discountType: v.discountType,
        discountValue: v.discountValue,
        usedAt: v.usedAt,
      });
    }

    return { data, total };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW AGGREGATIONS FOR DASHBOARDS
  // ═══════════════════════════════════════════════════════════════════════════

  async getTotalBranches(match: Record<string, unknown> = {}): Promise<number> {
    return Branch.countDocuments(match).exec();
  }

  async getTotalProducts(match: Record<string, unknown> = {}): Promise<number> {
    return Product.countDocuments(match).exec();
  }

  async getTotalOrders(match: Record<string, unknown> = {}): Promise<number> {
    return Order.countDocuments(match).exec();
  }

  async getTotalRevenue(match: Record<string, unknown> = {}): Promise<number> {
    const result = await Order.aggregate([
      { $match: { ...match, status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]).exec();
    return result.length > 0 ? result[0].totalRevenue : 0;
  }

  async getRevenueTrend(range: DateRange, match: Record<string, unknown> = {}): Promise<RevenueTrendPoint[]> {
    const rows = await Order.aggregate([
      {
        $match: {
          ...match,
          status: 'delivered',
          createdAt: { $gte: range.from, $lte: range.to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat(range.groupBy), date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    return rows.map((row) => ({
      date: row._id,
      revenue: row.revenue,
      count: row.count,
    }));
  }

  async getRevenueByBranch(match: Record<string, unknown> = {}): Promise<any[]> {
    const rows = await Order.aggregate([
      { $match: { ...match, status: 'delivered' } },
      { $group: { _id: '$branchId', revenue: { $sum: '$totalAmount' } } },
      { $sort: { revenue: -1 } },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch',
        },
      },
      { $unwind: '$branch' },
      {
        $project: {
          _id: 1,
          branchName: '$branch.name',
          revenue: 1,
        },
      },
    ]).exec();
    return rows;
  }

  async getTopSellingProducts(limit: number, match: Record<string, unknown> = {}): Promise<any[]> {
    const rows = await Order.aggregate([
      { $match: { ...match, status: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          name: '$product.name',
          sku: '$product.sku',
          quantitySold: 1,
          revenue: 1,
        },
      },
    ]).exec();
    return rows;
  }

  async getLowStockProducts(limit: number, match: Record<string, unknown> = {}): Promise<any[]> {
    const rows = await Inventory.aggregate([
      { $match: { ...match, $expr: { $lte: ['$quantity', '$lowStockThreshold'] } } },
      { $sort: { quantity: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'branches',
          localField: 'branchId',
          foreignField: '_id',
          as: 'branch',
        },
      },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          productId: 1,
          productName: '$product.name',
          sku: '$product.sku',
          branchId: 1,
          branchName: '$branch.name',
          quantity: 1,
          lowStockThreshold: 1,
        },
      },
    ]).exec();
    return rows;
  }

  async getInventoryStats(match: Record<string, unknown> = {}): Promise<{ totalQuantity: number; totalValue: number }> {
    const rows = await Inventory.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$averageCost'] } },
        },
      },
    ]).exec();

    return rows.length > 0
      ? { totalQuantity: rows[0].totalQuantity, totalValue: rows[0].totalValue }
      : { totalQuantity: 0, totalValue: 0 };
  }

  async getTopCustomers(limit: number, match: Record<string, unknown> = {}): Promise<any[]> {
    const rows = await Order.aggregate([
      { $match: { ...match, status: 'delivered' } },
      {
        $group: {
          _id: '$customerId',
          totalSpent: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          fullName: '$user.fullName',
          email: '$user.email',
          totalSpent: 1,
          ordersCount: 1,
        },
      },
    ]).exec();
    return rows;
  }

  async getTopStaff(limit: number, match: Record<string, unknown> = {}): Promise<any[]> {
    const rows = await Order.aggregate([
      { $match: { ...match, status: 'delivered', confirmedBy: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$confirmedBy',
          confirmedCount: { $sum: 1 },
          revenueGenerated: { $sum: '$totalAmount' },
        },
      },
      { $sort: { confirmedCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          fullName: '$user.fullName',
          email: '$user.email',
          confirmedCount: 1,
          revenueGenerated: 1,
        },
      },
    ]).exec();
    return rows;
  }

  async countServedCustomers(match: Record<string, unknown> = {}): Promise<number> {
    const rows = await Order.aggregate([
      { $match: { ...match, status: 'delivered' } },
      { $group: { _id: '$customerId' } },
      { $count: 'total' },
    ]).exec();
    return rows.length > 0 ? rows[0].total : 0;
  }
}

export const statisticsRepository = new StatisticsRepository();
