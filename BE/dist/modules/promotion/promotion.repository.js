"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionRepository = exports.PromotionRepository = void 0;
const mongoose_1 = require("mongoose");
const promotion_model_1 = require("../../models/promotion.model");
const voucher_model_1 = require("../../models/voucher.model");
class PromotionRepository {
    // ─── Promotion ────────────────────────────────────────────
    async createPromotion(data) {
        const promotion = new promotion_model_1.Promotion(data);
        return promotion.save();
    }
    async findPromotionById(id) {
        return promotion_model_1.Promotion.findById(id).exec();
    }
    async findPromotions(filter) {
        const { status, scope, branchId, page = 1, limit = 20 } = filter;
        const query = {};
        if (status)
            query.status = status;
        if (scope)
            query.scope = scope;
        if (branchId)
            query.branchId = new mongoose_1.Types.ObjectId(branchId);
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            promotion_model_1.Promotion.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            promotion_model_1.Promotion.countDocuments(query).exec(),
        ]);
        return { data, total };
    }
    async updatePromotion(id, data) {
        return promotion_model_1.Promotion.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
    }
    async deletePromotion(id) {
        return promotion_model_1.Promotion.findByIdAndDelete(id).exec();
    }
    async incrementUsageCount(promotionId) {
        await promotion_model_1.Promotion.findByIdAndUpdate(promotionId, { $inc: { usageCount: 1 } }).exec();
    }
    // ─── Voucher ──────────────────────────────────────────────
    async createVoucher(data) {
        const voucher = new voucher_model_1.Voucher(data);
        return voucher.save();
    }
    async createManyVouchers(data) {
        const docs = await voucher_model_1.Voucher.insertMany(data);
        return docs;
    }
    async findVoucherByCode(code) {
        return voucher_model_1.Voucher.findOne({ code: code.toUpperCase() }).exec();
    }
    async findVoucherById(id) {
        return voucher_model_1.Voucher.findById(id).exec();
    }
    async findVouchersByPromotion(filter) {
        const { promotionId, status, page = 1, limit = 50 } = filter;
        const query = {};
        if (promotionId)
            query.promotionId = new mongoose_1.Types.ObjectId(promotionId);
        if (status)
            query.status = status;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            voucher_model_1.Voucher.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            voucher_model_1.Voucher.countDocuments(query).exec(),
        ]);
        return { data, total };
    }
    async updateVoucherStatus(id, status) {
        return voucher_model_1.Voucher.findByIdAndUpdate(id, { $set: { status } }, { new: true }).exec();
    }
    async markVoucherUsedWithOrder(id, userId, orderId) {
        return voucher_model_1.Voucher.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(id), 'claims.userId': new mongoose_1.Types.ObjectId(userId) }, {
            $set: {
                'claims.$.status': 'used',
                'claims.$.usedAt': new Date(),
                'claims.$.orderId': new mongoose_1.Types.ObjectId(orderId),
            },
        }, { new: true }).exec();
    }
    async disableManyVouchersByPromotion(promotionId) {
        await voucher_model_1.Voucher.updateMany({ promotionId: new mongoose_1.Types.ObjectId(promotionId), status: 'active' }, { $set: { status: 'disabled' } }).exec();
    }
    async countActiveVouchersByPromotion(promotionId) {
        return voucher_model_1.Voucher.countDocuments({
            promotionId: new mongoose_1.Types.ObjectId(promotionId),
            status: 'active',
        }).exec();
    }
}
exports.PromotionRepository = PromotionRepository;
exports.promotionRepository = new PromotionRepository();
//# sourceMappingURL=promotion.repository.js.map