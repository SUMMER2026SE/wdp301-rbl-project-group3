"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = exports.OrderController = void 0;
const order_service_1 = require("./order.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class OrderController {
    constructor() {
        this.getAll = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const page = Math.max(1, parseInt(req.query['page']) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query['limit']) || 10));
            const result = await order_service_1.orderService.getOrders({
                branchId: req.query.branchId,
                status: req.query.status,
                keyword: req.query.keyword,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                page,
                limit,
            }, {
                userId: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(res, result, 'Orders retrieved');
        });
        this.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const order = await order_service_1.orderService.getOrderById(String(req.params.id), {
                userId: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(res, { order }, 'Order retrieved');
        });
        this.confirm = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const order = await order_service_1.orderService.confirmOrder(String(req.params.id), {
                userId: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(res, { order }, 'Order confirmed');
        });
        this.updateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const order = await order_service_1.orderService.updateStatus(String(req.params.id), req.body.status, {
                userId: req.user.userId,
                role: req.user.role,
            });
            (0, response_util_1.sendSuccess)(res, { order }, 'Order status updated');
        });
        this.getMyOrders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const customerId = req.user.userId;
            const page = Math.max(1, parseInt(req.query['page']) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(req.query['limit']) || 10));
            const status = req.query['status'];
            const result = await order_service_1.orderService.getOrderHistory(customerId, page, limit, status);
            (0, response_util_1.sendSuccess)(res, result, 'Order history retrieved');
        });
        this.trackMyOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const result = await order_service_1.orderService.trackOrder(req.params['orderId'], req.user.userId);
            (0, response_util_1.sendSuccess)(res, result, 'Order tracking retrieved');
        });
        this.getMyOrderById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const order = await order_service_1.orderService.getCustomerOrderById(req.params['orderId'], req.user.userId);
            (0, response_util_1.sendSuccess)(res, { order }, 'Order retrieved');
        });
        this.cancelMyOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const order = await order_service_1.orderService.cancelCustomerOrder(req.params['orderId'], req.user.userId, req.body.reason);
            (0, response_util_1.sendSuccess)(res, { order }, 'Order cancelled successfully');
        });
        this.placeOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const customerId = req.user.userId;
            const order = await order_service_1.orderService.placeOrder(customerId, req.body);
            (0, response_util_1.sendSuccess)(res, order, 'Đơn hàng đã được tạo thành công', 201);
        });
    }
}
exports.OrderController = OrderController;
exports.orderController = new OrderController();
//# sourceMappingURL=order.controller.js.map