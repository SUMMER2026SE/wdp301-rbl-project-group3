"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.OrderService = void 0;
const mongoose_1 = require("mongoose");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const inventory_repository_1 = require("../inventory/inventory.repository");
const order_repository_1 = require("./order.repository");
const allowedTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['pending', 'preparing', 'cancelled'],
    preparing: ['confirmed', 'delivering', 'cancelled'],
    delivering: ['preparing', 'delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
};
class OrderService {
    async getOrders(filters) {
        return order_repository_1.orderRepository.findAll(filters);
    }
    async getOrderById(id) {
        const order = await order_repository_1.orderRepository.findById(id);
        if (!order)
            throw new errorHandler_middleware_1.AppError('Order not found', 404);
        return order;
    }
    async confirmOrder(id, staffId) {
        const order = await this.getOrderById(id);
        if (order.status !== 'pending') {
            throw new errorHandler_middleware_1.AppError('Only pending orders can be confirmed', 400);
        }
        await this.ensureStockAvailable(order);
        await this.decreaseOrderStock(order, staffId);
        let updated;
        try {
            updated = await order_repository_1.orderRepository.updateStatusIfCurrent(id, order.status, {
                status: 'confirmed',
                confirmedBy: staffId,
                confirmedAt: new Date(),
            });
        }
        catch (error) {
            await this.increaseOrderStock(order, staffId);
            throw error;
        }
        if (!updated) {
            await this.increaseOrderStock(order, staffId);
            throw new errorHandler_middleware_1.AppError('Order status changed by another request. Please reload and try again.', 409);
        }
        return updated;
    }
    async updateStatus(id, status, staffId) {
        const order = await this.getOrderById(id);
        const nextStatuses = allowedTransitions[order.status];
        if (!nextStatuses.includes(status)) {
            throw new errorHandler_middleware_1.AppError(`Cannot change order status from ${order.status} to ${status}`, 400);
        }
        const update = { status };
        let stockDecreased = false;
        let stockIncreased = false;
        const isProcessingState = (s) => ['confirmed', 'preparing', 'delivering'].includes(s);
        // If moving from pending to a processing state, decrease stock
        if (order.status === 'pending' && isProcessingState(status)) {
            await this.ensureStockAvailable(order);
            await this.decreaseOrderStock(order, staffId);
            stockDecreased = true;
            if (status === 'confirmed') {
                update.confirmedBy = staffId;
                update.confirmedAt = new Date();
            }
        }
        // If moving from a processing state back to pending or to cancelled, increase/restore stock
        if (isProcessingState(order.status) && (status === 'pending' || status === 'cancelled')) {
            await this.increaseOrderStock(order, staffId);
            stockIncreased = true;
        }
        let updated;
        try {
            updated = await order_repository_1.orderRepository.updateStatusIfCurrent(id, order.status, update);
        }
        catch (error) {
            await this.rollbackStockChange(order, staffId, stockDecreased, stockIncreased);
            throw error;
        }
        if (!updated) {
            await this.rollbackStockChange(order, staffId, stockDecreased, stockIncreased);
            throw new errorHandler_middleware_1.AppError('Order status changed by another request. Please reload and try again.', 409);
        }
        return updated;
    }
    async ensureStockAvailable(order) {
        const branchId = this.getObjectIdString(order.branchId);
        for (const item of order.items) {
            const productId = this.getObjectIdString(item.productId);
            const stock = await inventory_repository_1.inventoryRepository.findInventoryItem(branchId, productId);
            if (!stock || stock.quantity < item.quantity) {
                throw new errorHandler_middleware_1.AppError(`Insufficient stock for product ${productId}`, 400);
            }
        }
    }
    async decreaseOrderStock(order, staffId) {
        const branchId = this.getObjectIdString(order.branchId);
        const decreasedItems = [];
        for (const item of order.items) {
            const productId = this.getObjectIdString(item.productId);
            try {
                const updated = await inventory_repository_1.inventoryRepository.decreaseStock({
                    branchId,
                    productId,
                    quantity: item.quantity,
                    updatedBy: staffId,
                });
                if (!updated) {
                    throw new errorHandler_middleware_1.AppError(`Insufficient stock for product ${productId}`, 400);
                }
                decreasedItems.push({ productId, quantity: item.quantity });
            }
            catch (error) {
                await this.restoreDecreasedStock(branchId, decreasedItems, staffId);
                throw error;
            }
        }
    }
    async restoreDecreasedStock(branchId, items, staffId) {
        for (const item of items) {
            await inventory_repository_1.inventoryRepository.increaseStock({
                branchId,
                productId: item.productId,
                quantity: item.quantity,
                updatedBy: staffId,
            });
        }
    }
    async increaseOrderStock(order, staffId) {
        const branchId = this.getObjectIdString(order.branchId);
        for (const item of order.items) {
            const productId = this.getObjectIdString(item.productId);
            const updated = await inventory_repository_1.inventoryRepository.increaseStock({
                branchId,
                productId,
                quantity: item.quantity,
                updatedBy: staffId,
            });
            if (!updated) {
                throw new errorHandler_middleware_1.AppError(`Inventory record not found for product ${productId}`, 404);
            }
        }
    }
    async rollbackStockChange(order, staffId, stockDecreased, stockIncreased) {
        if (stockDecreased) {
            await this.increaseOrderStock(order, staffId);
        }
        if (stockIncreased) {
            await this.decreaseOrderStock(order, staffId);
        }
    }
    getObjectIdString(value) {
        if (value instanceof mongoose_1.Types.ObjectId)
            return value.toString();
        if (value && typeof value === 'object' && '_id' in value) {
            return String(value._id);
        }
        return String(value);
    }
    buildCustomerOrderResponse(order) {
        const branch = order.branchId;
        return {
            orderId: order._id.toString(),
            code: order.code,
            status: order.status,
            branch: branch?._id
                ? {
                    branchId: branch._id.toString(),
                    name: branch.name,
                    code: branch.code,
                    address: branch.address,
                    phone: branch.phone ?? null,
                }
                : { branchId: String(order.branchId) },
            items: order.items.map((item) => {
                const product = item.productId;
                return {
                    productId: product?._id?.toString() ?? String(item.productId ?? ''),
                    productName: product?.name ?? '',
                    sku: product?.sku ?? '',
                    unit: product?.unit ?? '',
                    imageUrl: product?.imageUrl ?? null,
                    quantity: item.quantity ?? 0,
                    unitPrice: item.unitPrice ?? 0,
                    subtotal: item.subtotal ?? 0,
                };
            }),
            totalAmount: order.totalAmount,
            deliveryAddress: order.deliveryAddress ?? null,
            note: order.note ?? null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }
    async getOrderHistory(customerId, page, limit, status) {
        const validStatuses = [
            'pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled',
        ];
        if (status && !validStatuses.includes(status)) {
            throw new errorHandler_middleware_1.AppError(`Invalid status. Valid values: ${validStatuses.join(', ')}`, 400);
        }
        const { orders, total } = await order_repository_1.orderRepository.findByCustomerId(customerId, page, limit, status);
        const totalPages = Math.ceil(total / limit);
        return {
            orders: orders.map((o) => this.buildCustomerOrderResponse(o)),
            pagination: {
                total, page, limit, totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }
    async trackOrder(orderId, customerId) {
        const order = await order_repository_1.orderRepository.findByIdAndCustomerId(orderId, customerId);
        if (!order)
            throw new errorHandler_middleware_1.AppError('Order not found', 404);
        const trackingEvents = await order_repository_1.orderRepository.findTrackingByOrderId(orderId);
        return {
            order: this.buildCustomerOrderResponse(order),
            tracking: trackingEvents.map((e) => ({
                trackingId: e._id.toString(),
                status: e.status,
                location: e.location ?? null,
                note: e.note ?? null,
                timestamp: e.createdAt,
            })),
            currentStatus: order.status,
        };
    }
    async getCustomerOrderById(orderId, customerId) {
        const order = await order_repository_1.orderRepository.findByIdAndCustomerId(orderId, customerId);
        if (!order)
            throw new errorHandler_middleware_1.AppError('Order not found', 404);
        return this.buildCustomerOrderResponse(order);
    }
    async cancelCustomerOrder(orderId, customerId, reason) {
        const order = await order_repository_1.orderRepository.findByIdAndCustomerId(orderId, customerId);
        if (!order)
            throw new errorHandler_middleware_1.AppError('Order not found', 404);
        if (order.status !== 'pending') {
            throw new errorHandler_middleware_1.AppError(`Cannot cancel order with status "${order.status}". Only pending orders can be cancelled.`, 409);
        }
        const [updatedOrder] = await Promise.all([
            order_repository_1.orderRepository.cancelByCustomer(orderId),
            order_repository_1.orderRepository.addTrackingEvent(orderId, 'cancelled', reason ?? 'Cancelled by customer'),
        ]);
        if (!updatedOrder)
            throw new errorHandler_middleware_1.AppError('Failed to cancel order', 500);
        return this.buildCustomerOrderResponse(updatedOrder);
    }
}
exports.OrderService = OrderService;
exports.orderService = new OrderService();
//# sourceMappingURL=order.service.js.map