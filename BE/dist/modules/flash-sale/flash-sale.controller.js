"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flashSaleController = exports.FlashSaleController = void 0;
const flash_sale_service_1 = require("./flash-sale.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
function queryStr(value) {
    if (Array.isArray(value))
        return value[0];
    if (typeof value === 'string')
        return value;
    return undefined;
}
class FlashSaleController {
    constructor() {
        this.createFlashSale = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { userId, role } = req.user;
            const caller = await flash_sale_service_1.flashSaleService.buildCallerContext(userId, role);
            const result = await flash_sale_service_1.flashSaleService.createFlashSale(caller, req.body);
            (0, response_util_1.sendSuccess)(res, { flashSale: result }, 'Flash sale created successfully', 201);
        });
        this.listFlashSales = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { userId, role } = req.user;
            const caller = await flash_sale_service_1.flashSaleService.buildCallerContext(userId, role);
            const status = queryStr(req.query.status);
            const scope = queryStr(req.query.scope);
            const branchId = queryStr(req.query.branchId);
            const page = queryStr(req.query.page);
            const limit = queryStr(req.query.limit);
            const result = await flash_sale_service_1.flashSaleService.listFlashSales(caller, {
                status,
                scope,
                branchId,
                page,
                limit,
            });
            (0, response_util_1.sendSuccess)(res, result, 'Flash sales retrieved successfully');
        });
        this.getFlashSale = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { userId, role } = req.user;
            const caller = await flash_sale_service_1.flashSaleService.buildCallerContext(userId, role);
            const id = String(req.params.id);
            const flashSale = await flash_sale_service_1.flashSaleService.getFlashSaleById(caller, id);
            (0, response_util_1.sendSuccess)(res, { flashSale }, 'Flash sale retrieved successfully');
        });
        this.updateFlashSale = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { userId, role } = req.user;
            const caller = await flash_sale_service_1.flashSaleService.buildCallerContext(userId, role);
            const id = String(req.params.id);
            const result = await flash_sale_service_1.flashSaleService.updateFlashSale(caller, id, req.body);
            (0, response_util_1.sendSuccess)(res, { flashSale: result }, 'Flash sale updated successfully');
        });
        this.deleteFlashSale = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { userId, role } = req.user;
            const caller = await flash_sale_service_1.flashSaleService.buildCallerContext(userId, role);
            const id = String(req.params.id);
            await flash_sale_service_1.flashSaleService.deleteFlashSale(caller, id);
            (0, response_util_1.sendSuccess)(res, null, 'Flash sale deleted successfully');
        });
        this.getActiveFlashSale = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const branchId = queryStr(req.query.branchId);
            const flashSale = await flash_sale_service_1.flashSaleService.getActiveFlashSale(branchId);
            if (!flashSale) {
                return (0, response_util_1.sendSuccess)(res, { flashSale: null }, 'No active flash sale found');
            }
            (0, response_util_1.sendSuccess)(res, { flashSale }, 'Active flash sale retrieved successfully');
        });
    }
}
exports.FlashSaleController = FlashSaleController;
exports.flashSaleController = new FlashSaleController();
//# sourceMappingURL=flash-sale.controller.js.map