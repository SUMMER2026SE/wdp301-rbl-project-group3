"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const competitor_product_controller_1 = require("./competitor-product.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Only admin can view and import competitor products
router.get('/', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin'), competitor_product_controller_1.competitorProductController.getCompetitorProducts);
router.post('/import', auth_middleware_1.authenticate, (0, role_middleware_1.authorize)('admin'), competitor_product_controller_1.competitorProductController.importToCatalog);
exports.default = router;
//# sourceMappingURL=competitor-product.routes.js.map