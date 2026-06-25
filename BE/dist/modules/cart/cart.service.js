"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartService = exports.CartService = void 0;
const cart_repository_1 = require("./cart.repository");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const product_model_1 = require("../../models/product.model");
const inventory_model_1 = require("../../models/inventory.model");
async function buildCartResponse(cart, branchId) {
    const items = [];
    for (const item of cart.items) {
        if (!item.productId || item.productId.status !== 'active')
            continue;
        const product = item.productId;
        let price = product?.salePrice ?? 0;
        // If branchId is provided, get price from Inventory.lastImportCost
        if (branchId) {
            const inventory = await inventory_model_1.Inventory.findOne({
                productId: product._id,
                branchId: branchId,
            }).exec();
            if (inventory && inventory.lastImportCost) {
                price = inventory.lastImportCost;
            }
        }
        items.push({
            itemId: item._id.toString(),
            product: {
                id: product?._id?.toString() ?? '',
                name: product?.name ?? 'Unknown',
                price,
                unit: product?.unit,
                imageUrl: product?.imageUrl,
            },
            quantity: item.quantity,
            subtotal: price * item.quantity,
            addedAt: item.addedAt,
        });
    }
    const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);
    return {
        cartId: cart._id.toString(),
        items,
        totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
        totalAmount,
    };
}
class CartService {
    // ─── UC07: Thêm vào giỏ hàng ─────────────────────────────────────────────
    async addToCart(userId, productId, quantity, branchId) {
        if (quantity < 1) {
            throw new errorHandler_middleware_1.AppError('Quantity must be at least 1', 400);
        }
        if (quantity > 100) {
            throw new errorHandler_middleware_1.AppError('Quantity cannot exceed 100 per request', 400);
        }
        // Kiểm tra sản phẩm tồn tại và đang bán
        const product = await product_model_1.Product.findById(productId).exec();
        if (!product)
            throw new errorHandler_middleware_1.AppError('Product not found', 404);
        if (!product.status)
            throw new errorHandler_middleware_1.AppError('Product is not available', 400);
        // Kiểm tra số lượng item trong giỏ không vượt quá giới hạn
        const rawCart = await cart_repository_1.cartRepository.findRawByUserId(userId);
        if (rawCart) {
            const existing = rawCart.items.find((i) => i.productId.toString() === productId);
            const newQty = (existing?.quantity ?? 0) + quantity;
            if (newQty > 999) {
                throw new errorHandler_middleware_1.AppError('Cannot add more than 999 of the same product to cart', 400);
            }
        }
        const cart = await cart_repository_1.cartRepository.upsertItem(userId, productId, quantity);
        return await buildCartResponse(cart, branchId);
    }
    // ─── UC08: Xem giỏ hàng ──────────────────────────────────────────────────
    async getCart(userId, branchId) {
        const cart = await cart_repository_1.cartRepository.findByUserId(userId);
        if (!cart) {
            // Trả về giỏ rỗng thay vì lỗi 404
            return { cartId: '', items: [], totalItems: 0, totalAmount: 0 };
        }
        return await buildCartResponse(cart, branchId);
    }
    // ─── UC08: Cập nhật số lượng ──────────────────────────────────────────────
    async updateItemQuantity(userId, itemId, quantity, branchId) {
        if (quantity < 0) {
            throw new errorHandler_middleware_1.AppError('Quantity must be non-negative', 400);
        }
        if (quantity > 999) {
            throw new errorHandler_middleware_1.AppError('Quantity cannot exceed 999', 400);
        }
        // Kiểm tra item thuộc về cart của user
        const rawCart = await cart_repository_1.cartRepository.findRawByUserId(userId);
        if (!rawCart)
            throw new errorHandler_middleware_1.AppError('Cart not found', 404);
        const itemExists = rawCart.items.some((i) => i._id.toString() === itemId);
        if (!itemExists)
            throw new errorHandler_middleware_1.AppError('Cart item not found', 404);
        const cart = await cart_repository_1.cartRepository.updateItemQuantity(userId, itemId, quantity);
        if (!cart)
            throw new errorHandler_middleware_1.AppError('Failed to update cart', 500);
        return await buildCartResponse(cart, branchId);
    }
    // ─── UC08: Xóa một item ───────────────────────────────────────────────────
    async removeItem(userId, itemId, branchId) {
        const rawCart = await cart_repository_1.cartRepository.findRawByUserId(userId);
        if (!rawCart)
            throw new errorHandler_middleware_1.AppError('Cart not found', 404);
        const itemExists = rawCart.items.some((i) => i._id.toString() === itemId);
        if (!itemExists)
            throw new errorHandler_middleware_1.AppError('Cart item not found', 404);
        const cart = await cart_repository_1.cartRepository.removeItem(userId, itemId);
        if (!cart)
            throw new errorHandler_middleware_1.AppError('Failed to remove item', 500);
        return await buildCartResponse(cart, branchId);
    }
    // ─── UC08: Xóa toàn bộ giỏ ───────────────────────────────────────────────
    async clearCart(userId) {
        await cart_repository_1.cartRepository.clearCart(userId);
    }
}
exports.CartService = CartService;
exports.cartService = new CartService();
//# sourceMappingURL=cart.service.js.map