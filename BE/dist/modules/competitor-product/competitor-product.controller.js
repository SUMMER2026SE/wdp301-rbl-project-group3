"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitorProductController = exports.CompetitorProductController = void 0;
const competitor_product_service_1 = require("./competitor-product.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class CompetitorProductController {
    constructor() {
        this.getCompetitorProducts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { page, limit, keyword } = req.query;
            const result = await competitor_product_service_1.competitorProductService.getCompetitorProducts({
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                keyword: keyword ? String(keyword) : undefined,
            });
            (0, response_util_1.sendSuccess)(res, result, 'Competitor products retrieved successfully', 200);
        });
        this.importToCatalog = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                throw new Error('Please provide an array of competitor product IDs');
            }
            const result = await competitor_product_service_1.competitorProductService.importToCatalog(ids);
            (0, response_util_1.sendSuccess)(res, result, `Successfully imported ${result.importedCount} products to catalog`, 200);
        });
    }
}
exports.CompetitorProductController = CompetitorProductController;
exports.competitorProductController = new CompetitorProductController();
//# sourceMappingURL=competitor-product.controller.js.map