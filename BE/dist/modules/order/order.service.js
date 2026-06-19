"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.OrderService = void 0;
const mongoose_1 = require("mongoose");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const inventory_repository_1 = require("../inventory/inventory.repository");
const order_repository_1 = require("./order.repository");
const allowedTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['delivering', 'cancelled'],
    delivering: ['delivered'],
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
        if (status === 'confirmed') {
            await this.ensureStockAvailable(order);
            await this.decreaseOrderStock(order, staffId);
            stockDecreased = true;
            update.confirmedBy = staffId;
            update.confirmedAt = new Date();
        }
        if (status === 'cancelled' && ['confirmed', 'preparing'].includes(order.status)) {
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
}
exports.OrderService = OrderService;
exports.orderService = new OrderService();
//# sourceMappingURL=order.service.js.map