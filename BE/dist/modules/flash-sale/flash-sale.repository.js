"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flashSaleRepository = exports.FlashSaleRepository = void 0;
const mongoose_1 = require("mongoose");
const flash_sale_model_1 = require("../../models/flash-sale.model");
class FlashSaleRepository {
    async createFlashSale(data) {
        const flashSale = new flash_sale_model_1.FlashSale(data);
        return flashSale.save();
    }
    async findFlashSaleById(id) {
        return flash_sale_model_1.FlashSale.findById(id).populate('products.productId').exec();
    }
    async findFlashSales(filter) {
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
            flash_sale_model_1.FlashSale.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('products.productId')
                .populate('branchId', 'name code')
                .exec(),
            flash_sale_model_1.FlashSale.countDocuments(query).exec(),
        ]);
        return { data, total };
    }
    async updateFlashSale(id, data) {
        return flash_sale_model_1.FlashSale.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
            .populate('products.productId')
            .exec();
    }
    async deleteFlashSale(id) {
        return flash_sale_model_1.FlashSale.findByIdAndDelete(id).exec();
    }
    /**
     * Finds the currently active flash sale for a branch (or falls back to global).
     */
    async findActiveFlashSale(branchId) {
        const now = new Date();
        if (branchId) {
            // 1. Try to find a branch-specific active flash sale
            const branchSale = await flash_sale_model_1.FlashSale.findOne({
                status: 'active',
                scope: 'branch',
                branchId: new mongoose_1.Types.ObjectId(branchId),
                startDate: { $lte: now },
                endDate: { $gte: now },
            })
                .populate('products.productId')
                .exec();
            if (branchSale)
                return branchSale;
        }
        // 2. Fallback: Find a global active flash sale
        return flash_sale_model_1.FlashSale.findOne({
            status: 'active',
            scope: 'global',
            startDate: { $lte: now },
            endDate: { $gte: now },
        })
            .populate('products.productId')
            .exec();
    }
    /**
     * Increments the sold quantity of a product in a flash sale campaign.
     */
    async incrementProductSoldQuantity(flashSaleId, productId, quantity) {
        await flash_sale_model_1.FlashSale.updateOne({
            _id: new mongoose_1.Types.ObjectId(flashSaleId),
            'products.productId': new mongoose_1.Types.ObjectId(productId),
        }, {
            $inc: { 'products.$.soldQuantity': quantity },
        }).exec();
    }
    /**
     * Decrements the sold quantity of a product in a flash sale campaign.
     */
    async decrementProductSoldQuantity(flashSaleId, productId, quantity) {
        await flash_sale_model_1.FlashSale.updateOne({
            _id: new mongoose_1.Types.ObjectId(flashSaleId),
            'products.productId': new mongoose_1.Types.ObjectId(productId),
        }, {
            $inc: { 'products.$.soldQuantity': -quantity },
        }).exec();
    }
    /**
     * Finds a flash sale campaign matching an order date, branch, and product.
     */
    async findFlashSaleByOrderProduct(orderDate, branchId, productId) {
        return flash_sale_model_1.FlashSale.findOne({
            startDate: { $lte: orderDate },
            endDate: { $gte: orderDate },
            'products.productId': new mongoose_1.Types.ObjectId(productId),
            $or: [
                { scope: 'global' },
                { scope: 'branch', branchId: new mongoose_1.Types.ObjectId(branchId) },
            ],
        }).exec();
    }
}
exports.FlashSaleRepository = FlashSaleRepository;
exports.flashSaleRepository = new FlashSaleRepository();
//# sourceMappingURL=flash-sale.repository.js.map