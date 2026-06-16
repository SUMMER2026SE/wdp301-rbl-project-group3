"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promotionService = exports.PromotionService = void 0;
const mongoose_1 = require("mongoose");
const promotion_repository_1 = require("./promotion.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
function generateVoucherCode(prefix = 'VC') {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = prefix;
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
function toPromotionResponse(p) {
    return {
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        discountType: p.discountType,
        discountValue: p.discountValue,
        maxDiscountAmount: p.maxDiscountAmount,
        minOrderAmount: p.minOrderAmount,
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
function toVoucherResponse(v) {
    return {
        id: v._id.toString(),
        code: v.code,
        promotionId: v.promotionId.toString(),
        discountType: v.discountType,
        discountValue: v.discountValue,
        maxDiscountAmount: v.maxDiscountAmount,
        minOrderAmount: v.minOrderAmount,
        branchId: v.branchId?.toString(),
        expiresAt: v.expiresAt,
        status: v.status,
        usedBy: v.usedBy?.toString(),
        usedAt: v.usedAt,
        createdAt: v.createdAt,
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
    async listActivePromotions(filter) {
        const now = new Date();
        const { data } = await promotion_repository_1.promotionRepository.findPromotions({
            status: 'active',
            branchId: filter.branchId,
            page: filter.page,
            limit: filter.limit,
        });
        const filtered = data.filter((p) => p.startDate <= now && p.endDate >= now);
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        return {
            data: filtered.map(toPromotionResponse),
            pagination: {
                total: filtered.length,
                page,
                limit,
                totalPages: Math.ceil(filtered.length / limit),
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
    async generateVouchers(promotionId, quantity, caller) {
        if (quantity < 1 || quantity > 500) {
            throw new errorHandler_middleware_1.AppError('Quantity must be between 1 and 500', 400);
        }
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(promotionId);
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        this.assertCanManage(promotion, caller);
        if (promotion.status === 'expired') {
            throw new errorHandler_middleware_1.AppError('Cannot generate vouchers for an expired promotion', 400);
        }
        if (promotion.status === 'inactive') {
            throw new errorHandler_middleware_1.AppError('Cannot generate vouchers for an inactive promotion', 400);
        }
        if (promotion.usageLimit !== undefined) {
            const existing = await promotion_repository_1.promotionRepository.countActiveVouchersByPromotion(promotionId);
            const remaining = promotion.usageLimit - promotion.usageCount - existing;
            if (quantity > remaining) {
                throw new errorHandler_middleware_1.AppError(`Cannot generate ${quantity} vouchers. Only ${remaining} slots remaining based on usage limit.`, 400);
            }
        }
        const generatedCodes = new Set();
        const maxAttempts = quantity * 5;
        let attempts = 0;
        while (generatedCodes.size < quantity && attempts < maxAttempts) {
            generatedCodes.add(generateVoucherCode('VC'));
            attempts++;
        }
        if (generatedCodes.size < quantity) {
            throw new errorHandler_middleware_1.AppError('Failed to generate unique voucher codes. Please try again.', 500);
        }
        const voucherData = Array.from(generatedCodes).map((code) => ({
            code,
            promotionId: promotion._id,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            maxDiscountAmount: promotion.maxDiscountAmount,
            minOrderAmount: promotion.minOrderAmount,
            branchId: promotion.branchId,
            expiresAt: promotion.endDate,
            status: 'active',
            createdBy: new mongoose_1.Types.ObjectId(caller.userId),
        }));
        const vouchers = await promotion_repository_1.promotionRepository.createManyVouchers(voucherData);
        return {
            message: `${vouchers.length} vouchers generated successfully`,
            data: vouchers.map(toVoucherResponse),
        };
    }
    async listVouchers(promotionId, filter, caller) {
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(promotionId);
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        this.assertCanManage(promotion, caller);
        const { data, total } = await promotion_repository_1.promotionRepository.findVouchersByPromotion({
            promotionId,
            status: filter.status,
            page: filter.page,
            limit: filter.limit,
        });
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 50;
        return {
            data: data.map(toVoucherResponse),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async disableVoucher(voucherId, caller) {
        const voucher = await promotion_repository_1.promotionRepository.findVoucherById(voucherId);
        if (!voucher)
            throw new errorHandler_middleware_1.AppError('Voucher not found', 404);
        const promotion = await promotion_repository_1.promotionRepository.findPromotionById(voucher.promotionId.toString());
        if (!promotion)
            throw new errorHandler_middleware_1.AppError('Promotion not found', 404);
        this.assertCanManage(promotion, caller);
        if (voucher.status !== 'active') {
            throw new errorHandler_middleware_1.AppError(`Voucher is already ${voucher.status}`, 400);
        }
        const updated = await promotion_repository_1.promotionRepository.updateVoucherStatus(voucherId, 'disabled');
        return toVoucherResponse(updated);
    }
    async lookupVoucher(code) {
        const voucher = await promotion_repository_1.promotionRepository.findVoucherByCode(code);
        if (!voucher)
            throw new errorHandler_middleware_1.AppError('Voucher not found or invalid', 404);
        if (voucher.status !== 'active') {
            throw new errorHandler_middleware_1.AppError(`Voucher is ${voucher.status}`, 400);
        }
        if (voucher.expiresAt < new Date()) {
            await promotion_repository_1.promotionRepository.updateVoucherStatus(voucher._id.toString(), 'expired');
            throw new errorHandler_middleware_1.AppError('Voucher has expired', 400);
        }
        return toVoucherResponse(voucher);
    }
}
exports.PromotionService = PromotionService;
exports.promotionService = new PromotionService();
//# sourceMappingURL=promotion.service.js.map