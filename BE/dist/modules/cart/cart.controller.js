"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartController = exports.CartController = void 0;
const cart_service_1 = require("./cart.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class CartController {
    constructor() {
        // UC07 — POST /api/cart/items
        this.addToCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { productId, quantity, branchId } = req.body;
            const cart = await cart_service_1.cartService.addToCart(userId, productId, quantity, branchId);
            (0, response_util_1.sendSuccess)(res, cart, 'Item added to cart', 201);
        });
        // UC08 — GET /api/cart
        this.getCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const branchId = req.query.branchId;
            const cart = await cart_service_1.cartService.getCart(userId, branchId);
            (0, response_util_1.sendSuccess)(res, cart, 'Cart retrieved successfully');
        });
        // UC08 — PATCH /api/cart/items/:itemId
        this.updateItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const itemId = req.params['itemId'];
            const { quantity, branchId } = req.body;
            const cart = await cart_service_1.cartService.updateItemQuantity(userId, itemId, quantity, branchId);
            (0, response_util_1.sendSuccess)(res, cart, 'Cart item updated');
        });
        // UC08 — DELETE /api/cart/items/:itemId
        this.removeItem = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const itemId = req.params['itemId'];
            const branchId = req.query.branchId;
            const cart = await cart_service_1.cartService.removeItem(userId, itemId, branchId);
            (0, response_util_1.sendSuccess)(res, cart, 'Item removed from cart');
        });
        // UC08 — DELETE /api/cart
        this.clearCart = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            await cart_service_1.cartService.clearCart(userId);
            (0, response_util_1.sendSuccess)(res, null, 'Cart cleared');
        });
    }
}
exports.CartController = CartController;
exports.cartController = new CartController();
//# sourceMappingURL=cart.controller.js.map