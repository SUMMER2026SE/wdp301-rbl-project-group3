"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statisticsRepository = exports.StatisticsRepository = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../../models/user.model");
const promotion_model_1 = require("../../models/promotion.model");
const voucher_model_1 = require("../../models/voucher.model");
const order_model_1 = require("../../models/order.model");
const product_model_1 = require("../../models/product.model");
const inventory_model_1 = require("../../models/inventory.model");
const branch_model_1 = require("../../models/branch.model");
function dateFormat(groupBy) {
    return groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
}
// ─── Generic count-by-field helper ────────────────────────────────────────────
async function countByField(model, field, match) {
    const rows = await model
        .aggregate([{ $match: match }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }])
        .exec();
    const result = {};
    for (const row of rows) {
        const key = row._id ?? 'unknown';
        result[key] = row.count;
    }
    return result;
}
class StatisticsRepository {
    // ═══════════════════════════════════════════════════════════════════════════
    // USER STATISTICS (admin)
    // ═══════════════════════════════════════════════════════════════════════════
    async getTotalUsers(match = {}) {
        return user_model_1.User.countDocuments(match).exec();
    }
    async countUsersByRole(match = {}) {
        return countByField(user_model_1.User, 'role', match);
    }
    async countUsersByStatus(match = {}) {
        return countByField(user_model_1.User, 'status', match);
    }
    async countUsersByAuthProvider(match = {}) {
        return countByField(user_model_1.User, 'authProvider', match);
    }
    async countVerifiedUsers(match = {}) {
        const verified = await user_model_1.User.countDocuments({ ...match, isEmailVerified: true }).exec();
        const unverified = await user_model_1.User.countDocuments({ ...match, isEmailVerified: false }).exec();
        return { verified, unverified };
    }
    async userRegistrationTrend(range) {
        const rows = await user_model_1.User.aggregate([
            { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat(range.groupBy), date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]).exec();
        const result = [];
        for (const row of rows) {
            result.push({ date: row._id, count: row.count });
        }
        return result;
    }
    async countNewUsers(from, to, match = {}) {
        return user_model_1.User.countDocuments({ ...match, createdAt: { $gte: from, $lte: to } }).exec();
    }
    async countUsersByBranch(branchId) {
        return countByField(user_model_1.User, 'role', { branchId: new mongoose_1.Types.ObjectId(branchId) });
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // PROMOTION STATISTICS
    // ═══════════════════════════════════════════════════════════════════════════
    async getTotalPromotions(match = {}) {
        return promotion_model_1.Promotion.countDocuments(match).exec();
    }
    async countPromotionsByStatus(match = {}) {
        return countByField(promotion_model_1.Promotion, 'status', match);
    }
    async countPromotionsByScope(match = {}) {
        return countByField(promotion_model_1.Promotion, 'scope', match);
    }
    async countPromotionsByDiscountType(match = {}) {
        return countByField(promotion_model_1.Promotion, 'discountType', match);
    }
    async topPromotionsByUsage(limit, match = {}) {
        const docs = await promotion_model_1.Promotion.find(match)
            .sort({ usageCount: -1 })
            .limit(limit)
            .select('name discountType discountValue status usageCount usageLimit')
            .exec();
        const result = [];
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
    async promotionCreationTrend(range, match = {}) {
        const rows = await promotion_model_1.Promotion.aggregate([
            { $match: { ...match, createdAt: { $gte: range.from, $lte: range.to } } },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat(range.groupBy), date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]).exec();
        const result = [];
        for (const row of rows) {
            result.push({ date: row._id, count: row.count });
        }
        return result;
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // VOUCHER STATISTICS
    // ═══════════════════════════════════════════════════════════════════════════
    async getTotalVouchers(match = {}) {
        return voucher_model_1.Voucher.countDocuments(match).exec();
    }
    async countVouchersByStatus(match = {}) {
        return countByField(voucher_model_1.Voucher, 'status', match);
    }
    async countVouchersByStatusForPromotions(promotionIds) {
        const rows = await voucher_model_1.Voucher.aggregate([
            { $match: { promotionId: { $in: promotionIds } } },
            {
                $group: {
                    _id: { promotionId: '$promotionId', status: '$status' },
                    count: { $sum: 1 },
                },
            },
        ]).exec();
        const result = {};
        for (const row of rows) {
            const pid = row._id.promotionId.toString();
            if (!result[pid])
                result[pid] = {};
            result[pid][row._id.status] = row.count;
        }
        return result;
    }
    async voucherUsageTrend(range, match = {}) {
        const rows = await voucher_model_1.Voucher.aggregate([
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
        const result = [];
        for (const row of rows) {
            result.push({ date: row._id, count: row.count });
        }
        return result;
    }
    async getPromotionRevenue(match = {}) {
        const rows = await voucher_model_1.Voucher.aggregate([
            { $match: { ...match, status: 'used', orderId: { $exists: true, $ne: null } } },
            {
                $lookup: {
                    from: 'orders',
                    localField: 'orderId',
                    foreignField: '_id',
                    as: 'order',
                },
            },
            { $unwind: '$order' },
            { $match: { 'order.status': 'delivered' } }, // Only count revenue for delivered orders
            { $group: { _id: null, revenue: { $sum: '$order.totalAmount' } } },
        ]).exec();
        return rows.length > 0 ? rows[0].revenue : 0;
    }
    // ─── Personal voucher stats (cho /me) ─────────────────────────────────────
    async countVouchersUsedByUser(userId) {
        const status = 'used';
        return voucher_model_1.Voucher.countDocuments({
            usedBy: new mongoose_1.Types.ObjectId(userId),
            status,
        }).exec();
    }
    async listVouchersUsedByUser(userId, page, limit) {
        const skip = (page - 1) * limit;
        const status = 'used';
        const filter = { usedBy: new mongoose_1.Types.ObjectId(userId), status };
        const docs = await voucher_model_1.Voucher.find(filter)
            .sort({ usedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('code discountType discountValue usedAt')
            .exec();
        const total = await voucher_model_1.Voucher.countDocuments(filter).exec();
        const data = [];
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
    async getTotalBranches(match = {}) {
        return branch_model_1.Branch.countDocuments(match).exec();
    }
    async getTotalProducts(match = {}) {
        return product_model_1.Product.countDocuments(match).exec();
    }
    async getTotalOrders(match = {}) {
        return order_model_1.Order.countDocuments(match).exec();
    }
    async getTotalRevenue(match = {}) {
        const result = await order_model_1.Order.aggregate([
            { $match: { ...match, status: 'delivered' } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
        ]).exec();
        return result.length > 0 ? result[0].totalRevenue : 0;
    }
    async getRevenueTrend(range, match = {}) {
        const rows = await order_model_1.Order.aggregate([
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
    async getRevenueByBranch(match = {}) {
        const rows = await order_model_1.Order.aggregate([
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
    async getTopSellingProducts(limit, match = {}) {
        const rows = await order_model_1.Order.aggregate([
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
    async getLowStockProducts(limit, match = {}) {
        const rows = await inventory_model_1.Inventory.aggregate([
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
    async getInventoryStats(match = {}) {
        const rows = await inventory_model_1.Inventory.aggregate([
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
    async getTopCustomers(limit, match = {}) {
        const rows = await order_model_1.Order.aggregate([
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
    async getTopStaff(limit, match = {}) {
        const rows = await order_model_1.Order.aggregate([
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
    async countServedCustomers(match = {}) {
        const rows = await order_model_1.Order.aggregate([
            { $match: { ...match, status: 'delivered' } },
            { $group: { _id: '$customerId' } },
            { $count: 'total' },
        ]).exec();
        return rows.length > 0 ? rows[0].total : 0;
    }
}
exports.StatisticsRepository = StatisticsRepository;
exports.statisticsRepository = new StatisticsRepository();
//# sourceMappingURL=statistics.repository.js.map