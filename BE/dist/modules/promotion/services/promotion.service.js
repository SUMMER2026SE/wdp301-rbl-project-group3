"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionService = exports.PromotionService = void 0;
const mongoose_1 = require("mongoose");
const promotion_repository_1 = require("../promotion.repository");
const promotion_model_1 = require("../../../models/promotion.model");
const voucher_model_1 = require("../../../models/voucher.model");
const user_model_1 = require("../../../models/user.model");
const errorHandler_middleware_1 = require("../../../middlewares/errorHandler.middleware");
function toPromotionResponse(p) {
    return {
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        discountType: p.discountType,
        discountValue: p.discountValue,
        maxDiscountAmount: p.maxDiscountAmount,
        minOrderAmount: p.minOrderAmount,
        pointCost: p.pointCost || 0,
        targetMemberLevel: p.targetMemberLevel || 'all',
        scope: p.scope,
        branchId: p.branchId?.toString(),
        startDate: p.startDate,
        endDate: p.endDate,
        usageLimit: p.usageLimit,
        usageCount: p.usageCount,
        status: p.status,
        createdBy: p.createdBy.toString(),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
    };
}
class PromotionService {
    assertCanManage(promotion, caller) {
        if (caller.role === 'admin')
            return;
        if (caller.role === 'branch_manager') {
            if (!promotion.branchId ||
                !caller.branchId ||
                promotion.branchId.toString() !== caller.branchId) {
                throw new errorHandler_middleware_1.AppError('You can only manage promotions of your own branch', 403);
            }
            return;
        }
        throw new errorHandler_middleware_1.AppError('Insufficient permissions', 403);
    }
    async createPromotion(data, caller) {
        if (data.discountType === 'percentage' && data.discountValue > 100) {
            throw new errorHandler_middleware_1.AppError('Percentage discount value must be between 0 and 100', 400);
        }
        if (new Date(data.endDate) <= new Date(data.startDate)) {
            throw new errorHandler_middleware_1.AppError('End date must be after start date', 400);
        }
        if (data.scope === 'global' && caller.role !== 'admin') {
            throw new errorHandler_middleware_1.AppError('Only admin can create global promotions', 403);
        }
        if (data.scope === 'branch') {
            if (caller.role === 'branch_manager') {
                if (!caller.branchId)
                    throw new errorHandler_middleware_1.AppError('Your account is not assigned to any branch', 400);
                if (data.branchId && data.branchId !== caller.branchId) {
                    throw new errorHandler_middleware_1.AppError('You can only create promotions for your own branch', 403);
                }
                data.branchId = caller.branchId;
            }
            else if (caller.role === 'admin') {
                if (!data.branchId)
                    throw new errorHandler_middleware_1.AppError('branchId is required for branch-scoped promotions', 400);
            }
        }
        const promotion = await promotion_repository_1.promotionRepository.createPromotion({
            ...data,
            branchId: data.branchId ? new mongoose_1.Types.ObjectId(data.branchId) : undefined,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            status: data.status ?? 'draft',
            usageCount: 0,
            createdBy: new mongoose_1.Types.ObjectId(caller.userId),
        });
        return toPromotionResponse(promotion);
    }
    async listPromotions(filter, caller) {
        const query = {
            status: filter.status,
            scope: filter.scope,
            page: filter.page,
            limit: filter.limit,
        };
        if (caller.role === 'branch_manager') {
            if (!caller.branchId)
                throw new errorHandler_middleware_1.AppError('Your account is not assigned to any branch', 400);
            query.branchId = caller.branchId;
        }
        else if (caller.role === 'admin' && filter.branchId) {
            query.branchId = filter.branchId;
        }
        const { data, total } = await promotion_repository_1.promotionRepository.findPromotions(query);
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        return {
            data: data.map(toPromotionResponse),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async listActivePromotions(filter, caller) {
        const now = new Date();
        const query = {
            status: 'active',
            startDate: { $lte: now },
            endDate: { $gte: now },
        };
        if (filter.branchId) {
            query.$or = [
                { scope: 'global' },
                { scope: 'branch', branchId: new mongoose_1.Types.ObjectId(filter.branchId) },
            ];
        }
        else {
            query.scope = 'global';
        }
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            promotion_model_1.Promotion.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            promotion_model_1.Promotion.countDocuments(query).exec(),
        ]);
        const callerUserId = caller.userId;
        const user = await user_model_1.User.findById(callerUserId).select('memberLevel').lean().exec();
        const userLevel = user?.memberLevel || 'new';
        const levelRanks = { new: 0, bronze: 1, silver: 2, gold: 3, diamond: 4 };
        const levelNames = { new: 'Mới', bronze: 'Đồng', silver: 'Bạc', gold: 'Vàng', diamond: 'Kim cương' };
        const dataWithVouchers = await Promise.all(data.map(async (p) => {
            const queryVoucher = { promotionId: p._id, status: 'active', expiresAt: { $gt: now } };
            const vouchers = await voucher_model_1.Voucher.find(queryVoucher).exec();
            const vouchersList = vouchers.map((v) => {
                const userClaim = v.claims?.find((c) => c.userId.toString() === callerUserId);
                return {
                    code: v.code,
                    isClaimed: !!userClaim,
                    claimStatus: userClaim ? userClaim.status : null,
                    pointCost: v.pointCost || 0,
                };
            });
            let filteredVouchers = vouchersList;
            if (filter.onlyClaimed) {
                filteredVouchers = vouchersList.filter((v) => v.isClaimed && v.claimStatus === 'active');
            }
            const promoRes = toPromotionResponse(p);
            // Kiểm tra điều kiện cấp độ thành viên
            let isEligible = true;
            let ineligibleReason = '';
            if (p.targetMemberLevel && p.targetMemberLevel !== 'all') {
                if (p.targetMemberLevel === 'new') {
                    if (userLevel !== 'new') {
                        isEligible = false;
                        ineligibleReason = 'Chỉ dành cho khách hàng mới';
                    }
                }
                else {
                    const userRank = levelRanks[userLevel] || 0;
                    const requiredRank = levelRanks[p.targetMemberLevel] || 0;
                    if (userRank < requiredRank) {
                        isEligible = false;
                        ineligibleReason = `Yêu cầu cấp độ ${levelNames[p.targetMemberLevel]} trở lên`;
                    }
                }
            }
            return {
                ...promoRes,
                vouchers: filteredVouchers.map((v) => v.code),
                vouchersDetail: filteredVouchers,
                isEligible,
                ineligibleReason,
            };
        }));
        const finalData = dataWithVouchers.filter((p) => p.vouchers.length > 0);
        return {
            data: finalData,
            pagination: {
                total: finalData.length,
                page,
                limit,
                totalPages: Math.ceil(finalData.length / limit),
            },
        };
    }
    async getPromotion(promotionId, caller) {
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(promotionId);
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        if (caller.role === 'branch_manager') {
            if (!promotion.branchId ||
                !caller.branchId ||
                promotion.branchId.toString() !== caller.branchId) {
                throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
            }
        }
        return toPromotionResponse(promotion);
    }
    async updatePromotion(promotionId, data, caller) {
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(promotionId);
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        this.assertCanManage(promotion, caller);
        if (promotion.status === 'expired') {
            throw new errorHandler_middleware_1.AppError('Cannot update an expired promotion', 400);
        }
        if (data.discountType === 'percentage' &&
            data.discountValue !== undefined &&
            data.discountValue > 100) {
            throw new errorHandler_middleware_1.AppError('Percentage discount value must be between 0 and 100', 400);
        }
        const startDate = data.startDate ? new Date(data.startDate) : promotion.startDate;
        const endDate = data.endDate ? new Date(data.endDate) : promotion.endDate;
        if (endDate <= startDate)
            throw new errorHandler_middleware_1.AppError('End date must be after start date', 400);
        const updated = await promotion_repository_1.promotionRepository.updatePromotion(promotionId, {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
            updatedBy: new mongoose_1.Types.ObjectId(caller.userId),
        });
        if (!updated)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        return toPromotionResponse(updated);
    }
    async deletePromotion(promotionId, caller) {
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(promotionId);
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        this.assertCanManage(promotion, caller);
        if (promotion.status === 'active') {
            throw new errorHandler_middleware_1.AppError('Cannot delete an active promotion. Deactivate it first.', 400);
        }
        await promotion_repository_1.promotionRepository.disableManyVouchersByPromotion(promotionId);
        await promotion_repository_1.promotionRepository.deletePromotion(promotionId);
        return { message: 'Promotion deleted successfully' };
    }
    async activatePromotion(promotionId, caller) {
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(promotionId);
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        this.assertCanManage(promotion, caller);
        if (promotion.status === 'active')
            throw new errorHandler_middleware_1.AppError('Promotion is already active', 400);
        if (promotion.status === 'expired')
            throw new errorHandler_middleware_1.AppError('Cannot activate an expired promotion', 400);
        if (promotion.endDate < new Date())
            throw new errorHandler_middleware_1.AppError('Promotion end date has already passed', 400);
        const updated = await promotion_repository_1.promotionRepository.updatePromotion(promotionId, {
            status: 'active',
            updatedBy: new mongoose_1.Types.ObjectId(caller.userId),
        });
        return toPromotionResponse(updated);
    }
    async deactivatePromotion(promotionId, caller) {
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(promotionId);
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        this.assertCanManage(promotion, caller);
        if (promotion.status !== 'active')
            throw new errorHandler_middleware_1.AppError('Promotion is not active', 400);
        await promotion_repository_1.promotionRepository.disableManyVouchersByPromotion(promotionId);
        const updated = await promotion_repository_1.promotionRepository.updatePromotion(promotionId, {
            status: 'inactive',
            updatedBy: new mongoose_1.Types.ObjectId(caller.userId),
        });
        return toPromotionResponse(updated);
    }
}
exports.PromotionService = PromotionService;
exports.promotionService = new PromotionService();
//# sourceMappingURL=promotion.service.js.map