"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRepository = exports.OrderRepository = void 0;
const order_model_1 = require("../../models/order.model");
class OrderRepository {
    async findAll(filters) {
        const query = {};
        if (filters.branchId)
            query.branchId = filters.branchId;
        if (filters.status)
            query.status = filters.status;
        return order_model_1.Order.find(query)
            .populate('customerId', 'fullName email phone')
            .populate('branchId', 'name code address')
            .populate('items.productId', 'name sku unit')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findById(id) {
        return order_model_1.Order.findById(id)
            .populate('customerId', 'fullName email phone')
            .populate('branchId', 'name code address')
            .populate('items.productId', 'name sku unit')
            .exec();
    }
    async updateStatus(id, data) {
        return order_model_1.Order.findByIdAndUpdate(id, data, { new: true })
            .populate('customerId', 'fullName email phone')
            .populate('branchId', 'name code address')
            .populate('items.productId', 'name sku unit')
            .exec();
    }
    async updateStatusIfCurrent(id, currentStatus, data) {
        return order_model_1.Order.findOneAndUpdate({ _id: id, status: currentStatus }, data, { new: true })
            .populate('customerId', 'fullName email phone')
            .populate('branchId', 'name code address')
            .populate('items.productId', 'name sku unit')
            .exec();
    }
}
exports.OrderRepository = OrderRepository;
exports.orderRepository = new OrderRepository();
//# sourceMappingURL=order.repository.js.map