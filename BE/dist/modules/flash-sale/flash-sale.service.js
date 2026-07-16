"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flashSaleService = exports.FlashSaleService = void 0;
const mongoose_1 = require("mongoose");
const flash_sale_repository_1 = require("./flash-sale.repository");
const user_model_1 = require("../../models/user.model");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
class FlashSaleService {
    async buildCallerContext(userId, role) {
        if (role === 'branch_manager') {
            const user = await user_model_1.User.findById(userId).select('branchId').exec();
            if (!user)
                throw new errorHandler_middleware_1.AppError('User not found', 404);
            return { userId, role, branchId: user.branchId?.toString() };
        }
        return { userId, role: role };
    }
    async createFlashSale(caller, data) {
        if (caller.role === 'staff') {
            throw new errorHandler_middleware_1.AppError('Permission denied. Staff cannot create flash sales.', 403);
        }
        if (data.scope === 'global' && caller.role !== 'admin') {
            throw new errorHandler_middleware_1.AppError('Only admin can create global flash sales.', 403);
        }
        if (data.scope === 'branch') {
            if (caller.role === 'branch_manager') {
                if (!caller.branchId) {
                    throw new errorHandler_middleware_1.AppError('Your account is not assigned to any branch.', 400);
                }
                if (data.branchId && data.branchId !== caller.branchId) {
                    throw new errorHandler_middleware_1.AppError('You can only create flash sales for your own branch.', 403);
                }
                data.branchId = caller.branchId;
            }
            else if (caller.role === 'admin') {
                if (!data.branchId) {
                    throw new errorHandler_middleware_1.AppError('branchId is required for branch-scoped flash sales.', 400);
                }
            }
        }
        const payload = {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            branchId: data.branchId ? new mongoose_1.Types.ObjectId(data.branchId) : undefined,
            products: data.products.map((p) => ({
                productId: new mongoose_1.Types.ObjectId(p.productId),
                flashSalePrice: p.flashSalePrice,
                limitQuantity: p.limitQuantity,
                soldQuantity: 0,
            })),
            createdBy: new mongoose_1.Types.ObjectId(caller.userId),
        };
        return flash_sale_repository_1.flashSaleRepository.createFlashSale(payload);
    }
    async listFlashSales(caller, filterParams) {
        let filterBranchId = filterParams.branchId;
        if (caller.role === 'branch_manager') {
            filterBranchId = caller.branchId;
        }
        const filter = {
            status: filterParams.status,
            scope: filterParams.scope,
            branchId: filterBranchId,
            page: filterParams.page ? Number(filterParams.page) : undefined,
            limit: filterParams.limit ? Number(filterParams.limit) : undefined,
        };
        return flash_sale_repository_1.flashSaleRepository.findFlashSales(filter);
    }
    async getFlashSaleById(caller, id) {
        const flashSale = await flash_sale_repository_1.flashSaleRepository.findFlashSaleById(id);
        if (!flashSale) {
            throw new errorHandler_middleware_1.AppError('Flash sale not found', 404);
        }
        // Branch manager permission check
        if (caller.role === 'branch_manager') {
            if (flashSale.scope === 'global' || flashSale.branchId?.toString() !== caller.branchId) {
                throw new errorHandler_middleware_1.AppError('You can only view flash sales of your own branch.', 403);
            }
        }
        return flashSale;
    }
    async updateFlashSale(caller, id, data) {
        const flashSale = await flash_sale_repository_1.flashSaleRepository.findFlashSaleById(id);
        if (!flashSale) {
            throw new errorHandler_middleware_1.AppError('Flash sale not found', 404);
        }
        if (caller.role === 'staff') {
            throw new errorHandler_middleware_1.AppError('Permission denied. Staff cannot modify flash sales.', 403);
        }
        // Branch manager permission check
        if (caller.role === 'branch_manager') {
            if (flashSale.scope === 'global' || flashSale.branchId?.toString() !== caller.branchId) {
                throw new errorHandler_middleware_1.AppError('You can only update flash sales of your own branch.', 403);
            }
            // Force payload branch parameters if present
            if (data.scope && data.scope !== 'branch') {
                throw new errorHandler_middleware_1.AppError('You cannot change scope to global.', 403);
            }
            if (data.branchId && data.branchId !== caller.branchId) {
                throw new errorHandler_middleware_1.AppError('You cannot set branch to another branch.', 403);
            }
            data.scope = 'branch';
            data.branchId = caller.branchId;
        }
        const payload = { ...data };
        if (data.startDate)
            payload.startDate = new Date(data.startDate);
        if (data.endDate)
            payload.endDate = new Date(data.endDate);
        if (data.branchId)
            payload.branchId = new mongoose_1.Types.ObjectId(data.branchId);
        if (data.products) {
            payload.products = data.products.map((p) => ({
                productId: new mongoose_1.Types.ObjectId(p.productId),
                flashSalePrice: p.flashSalePrice,
                limitQuantity: p.limitQuantity,
                soldQuantity: p.soldQuantity ?? 0,
            }));
        }
        payload.updatedBy = new mongoose_1.Types.ObjectId(caller.userId);
        return flash_sale_repository_1.flashSaleRepository.updateFlashSale(id, payload);
    }
    async deleteFlashSale(caller, id) {
        const flashSale = await flash_sale_repository_1.flashSaleRepository.findFlashSaleById(id);
        if (!flashSale) {
            throw new errorHandler_middleware_1.AppError('Flash sale not found', 404);
        }
        if (caller.role === 'staff') {
            throw new errorHandler_middleware_1.AppError('Permission denied. Staff cannot delete flash sales.', 403);
        }
        // Branch manager permission check
        if (caller.role === 'branch_manager') {
            if (flashSale.scope === 'global' || flashSale.branchId?.toString() !== caller.branchId) {
                throw new errorHandler_middleware_1.AppError('You can only delete flash sales of your own branch.', 403);
            }
        }
        await flash_sale_repository_1.flashSaleRepository.deleteFlashSale(id);
    }
    async getActiveFlashSale(branchId) {
        return flash_sale_repository_1.flashSaleRepository.findActiveFlashSale(branchId);
    }
}
exports.FlashSaleService = FlashSaleService;
exports.flashSaleService = new FlashSaleService();
//# sourceMappingURL=flash-sale.service.js.map