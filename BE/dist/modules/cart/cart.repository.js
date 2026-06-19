"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRepository = exports.CartRepository = void 0;
const mongoose_1 = require("mongoose");
const cart_model_1 = require("../../models/cart.model");
class CartRepository {
    /** Lấy cart của user (có populate product) */
    async findByUserId(userId) {
        return cart_model_1.Cart.findOne({ userId })
            .populate({
            path: 'items.productId',
            select: 'productName price unit status',
        })
            .exec();
    }
    /** Lấy cart thô (không populate) — dùng cho các thao tác write */
    async findRawByUserId(userId) {
        return cart_model_1.Cart.findOne({ userId }).exec();
    }
    /** Tạo cart mới cho user */
    async createCart(userId) {
        const cart = new cart_model_1.Cart({ userId, items: [] });
        return cart.save();
    }
    /** Upsert: tìm hoặc tạo cart cho user */
    async findOrCreateCart(userId) {
        let cart = await this.findRawByUserId(userId);
        if (!cart) {
            cart = await this.createCart(userId);
        }
        return cart;
    }
    /**
     * Thêm sản phẩm vào giỏ hoặc tăng số lượng nếu đã có.
     * Trả về cart sau khi đã populated.
     */
    async upsertItem(userId, productId, quantity) {
        const productObjId = new mongoose_1.Types.ObjectId(productId);
        // Tìm cart, nếu chưa có thì tạo mới
        const cart = await this.findOrCreateCart(userId);
        const existingItem = cart.items.find((item) => item.productId.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        }
        else {
            cart.items.push({
                _id: new mongoose_1.Types.ObjectId(),
                productId: productObjId,
                quantity,
                addedAt: new Date(),
            });
        }
        await cart.save();
        // Trả về cart đã populated
        return (await this.findByUserId(userId));
    }
    /**
     * Cập nhật số lượng của một item.
     * Nếu quantity = 0 → xóa item khỏi giỏ.
     */
    async updateItemQuantity(userId, itemId, quantity) {
        if (quantity <= 0) {
            // Xóa item
            await cart_model_1.Cart.findOneAndUpdate({ userId }, { $pull: { items: { _id: new mongoose_1.Types.ObjectId(itemId) } } }).exec();
        }
        else {
            await cart_model_1.Cart.findOneAndUpdate({ userId, 'items._id': new mongoose_1.Types.ObjectId(itemId) }, { $set: { 'items.$.quantity': quantity } }).exec();
        }
        return this.findByUserId(userId);
    }
    /** Xóa một item khỏi giỏ */
    async removeItem(userId, itemId) {
        await cart_model_1.Cart.findOneAndUpdate({ userId }, { $pull: { items: { _id: new mongoose_1.Types.ObjectId(itemId) } } }).exec();
        return this.findByUserId(userId);
    }
    /** Xóa toàn bộ items trong giỏ (dùng sau khi đặt hàng thành công) */
    async clearCart(userId) {
        await cart_model_1.Cart.findOneAndUpdate({ userId }, { $set: { items: [] } }).exec();
    }
    /** Xóa các item đã được chọn thanh toán */
    async removeItems(userId, itemIds) {
        const objectIds = itemIds.map((id) => new mongoose_1.Types.ObjectId(id));
        await cart_model_1.Cart.findOneAndUpdate({ userId }, { $pull: { items: { _id: { $in: objectIds } } } }).exec();
    }
}
exports.CartRepository = CartRepository;
exports.cartRepository = new CartRepository();
//# sourceMappingURL=cart.repository.js.map