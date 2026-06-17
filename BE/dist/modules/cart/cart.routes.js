"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("./cart.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const cart_validation_1 = require("./cart.validation");
const router = (0, express_1.Router)();
// Tất cả cart routes đều yêu cầu đăng nhập + role customer
router.use(auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('customer'));
// UC07 — Thêm vào giỏ hàng
router.post('/items', (0, cart_validation_1.validate)(cart_validation_1.addToCartSchema), cart_controller_1.cartController.addToCart);
// UC08 — Xem giỏ hàng
router.get('/', cart_controller_1.cartController.getCart);
// UC08 — Cập nhật số lượng
router.patch('/items/:itemId', (0, cart_validation_1.validate)(cart_validation_1.updateCartItemSchema), cart_controller_1.cartController.updateItem);
// UC08 — Xóa một item
router.delete('/items/:itemId', (0, cart_validation_1.validate)(cart_validation_1.removeCartItemSchema), cart_controller_1.cartController.removeItem);
// UC08 — Xóa toàn bộ giỏ
router.delete('/', cart_controller_1.cartController.clearCart);
exports.default = router;
//# sourceMappingURL=cart.routes.js.map