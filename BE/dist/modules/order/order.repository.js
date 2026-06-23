"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRepository = exports.OrderRepository = void 0;
const mongoose_1 = require("mongoose");
const order_model_1 = require("../../models/order.model");
const deliveryTracking_model_1 = require("../../models/deliveryTracking.model");
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
    async findByCustomerId(customerId, page, limit, status) {
        const filter = {
            customerId: new mongoose_1.Types.ObjectId(customerId),
        };
        if (status)
            filter.status = status;
        const [orders, total] = await Promise.all([
            order_model_1.Order.find(filter)
                .populate('branchId', 'name code address')
                .populate('items.productId', 'name sku unit imageUrl')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            order_model_1.Order.countDocuments(filter),
        ]);
        return { orders, total };
    }
    async findByIdAndCustomerId(orderId, customerId) {
        return order_model_1.Order.findOne({
            _id: new mongoose_1.Types.ObjectId(orderId),
            customerId: new mongoose_1.Types.ObjectId(customerId),
        })
            .populate('branchId', 'name code address phone')
            .populate('items.productId', 'name sku unit imageUrl')
            .exec();
    }
    async cancelByCustomer(orderId) {
        return order_model_1.Order.findByIdAndUpdate(orderId, { $set: { status: 'cancelled' } }, { returnDocument: 'after' })
            .populate('branchId', 'name code address')
            .populate('items.productId', 'name sku unit')
            .exec();
    }
    async findTrackingByOrderId(orderId) {
        return deliveryTracking_model_1.DeliveryTracking.find({ orderId: new mongoose_1.Types.ObjectId(orderId) })
            .sort({ createdAt: 1 })
            .exec();
    }
    async addTrackingEvent(orderId, status, note, location) {
        return deliveryTracking_model_1.DeliveryTracking.create({
            orderId: new mongoose_1.Types.ObjectId(orderId),
            status,
            note,
            location,
        });
    }
}
exports.OrderRepository = OrderRepository;
exports.orderRepository = new OrderRepository();
//# sourceMappingURL=order.repository.js.map