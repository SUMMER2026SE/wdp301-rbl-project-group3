"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("../modules/user/user.routes"));
const branch_routes_1 = __importDefault(require("../modules/branch/branch.routes"));
const product_routes_1 = __importDefault(require("../modules/product/product.routes"));
const inventory_routes_1 = __importDefault(require("../modules/inventory/inventory.routes"));
const order_routes_1 = __importDefault(require("../modules/order/order.routes"));
const cart_routes_1 = __importDefault(require("../modules/cart/cart.routes"));
const promotion_routes_1 = __importDefault(require("../modules/promotion/promotion.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/branches', branch_routes_1.default);
router.use('/products', product_routes_1.default);
router.use('/inventory', inventory_routes_1.default);
router.use('/orders', order_routes_1.default);
router.use('/cart', cart_routes_1.default);
router.use('/promotions', promotion_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map