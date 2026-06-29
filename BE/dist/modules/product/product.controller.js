"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = exports.ProductController = void 0;
const product_service_1 = require("./product.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const product_validation_1 = require("./product.validation");
class ProductController {
    constructor() {
        this.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { query } = product_validation_1.listProductsSchema.parse({
                query: req.query,
                body: req.body,
                params: req.params,
            });
            const result = await product_service_1.productService.listProducts(query);
            (0, response_util_1.sendSuccess)(res, result, 'Products retrieved');
        });
        this.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const product = await product_service_1.productService.getProductById(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { product }, 'Product retrieved');
        });
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const product = await product_service_1.productService.createProduct(req.body, req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : undefined);
            (0, response_util_1.sendSuccess)(res, { product }, 'Product created', 201);
        });
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const product = await product_service_1.productService.updateProduct(String(req.params.id), req.body, req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : undefined);
            (0, response_util_1.sendSuccess)(res, { product }, 'Product updated');
        });
        this.delete = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const product = await product_service_1.productService.deleteProduct(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { product }, 'Product deleted');
        });
    }
}
exports.ProductController = ProductController;
exports.productController = new ProductController();
//# sourceMappingURL=product.controller.js.map