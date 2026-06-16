"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = exports.ProductController = void 0;
const product_service_1 = require("./product.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class ProductController {
    constructor() {
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const product = await product_service_1.productService.createProduct(req.body);
            (0, response_util_1.sendSuccess)(res, { product }, 'Product created', 201);
        });
        this.getAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const products = await product_service_1.productService.getProducts({
                status: req.query.status,
                keyword: req.query.keyword,
            });
            (0, response_util_1.sendSuccess)(res, { products }, 'Products retrieved');
        });
    }
}
exports.ProductController = ProductController;
exports.productController = new ProductController();
//# sourceMappingURL=product.controller.js.map