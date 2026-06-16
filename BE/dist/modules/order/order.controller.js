"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = exports.OrderController = void 0;
const order_service_1 = require("./order.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class OrderController {
    constructor() {
        this.getAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const orders = await order_service_1.orderService.getOrders({
                branchId: req.query.branchId,
                status: req.query.status,
            });
            (0, response_util_1.sendSuccess)(res, { orders }, 'Orders retrieved');
        });
        this.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const order = await order_service_1.orderService.getOrderById(String(req.params.id));
            (0, response_util_1.sendSuccess)(res, { order }, 'Order retrieved');
        });
        this.confirm = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const order = await order_service_1.orderService.confirmOrder(String(req.params.id), req.user.userId);
            (0, response_util_1.sendSuccess)(res, { order }, 'Order confirmed');
        });
        this.updateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const order = await order_service_1.orderService.updateStatus(String(req.params.id), req.body.status, req.user.userId);
            (0, response_util_1.sendSuccess)(res, { order }, 'Order status updated');
        });
    }
}
exports.OrderController = OrderController;
exports.orderController = new OrderController();
//# sourceMappingURL=order.controller.js.map