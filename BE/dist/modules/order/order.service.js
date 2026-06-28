"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.OrderService = void 0;
const mongoose_1 = require("mongoose");
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const order_model_1 = require("../../models/order.model");
const inventory_repository_1 = require("../inventory/inventory.repository");
const order_repository_1 = require("./order.repository");
const cart_repository_1 = require("../cart/cart.repository");
const validation_service_1 = require("../promotion/services/validation.service");
const calculation_service_1 = require("../promotion/services/calculation.service");
const usage_service_1 = require("../promotion/services/usage.service");
const invoice_repository_1 = require("../invoice/invoice.repository");
const user_model_1 = require("../../models/user.model");
const system_setting_repository_1 = require("../system-setting/system-setting.repository");
const flash_sale_repository_1 = require("../flash-sale/flash-sale.repository");
const backOfficeAccess_util_1 = require("../../utils/backOfficeAccess.util");
const allowedTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['delivering', 'cancelled'],
    delivering: ['delivered'],
    delivered: [],
    cancelled: [],
};
class OrderService {
    async getOrders(filters, actor) {
        const branchId = await (0, backOfficeAccess_util_1.resolveBackOfficeBranch)(actor, filters.branchId);
        return order_repository_1.orderRepository.findAll({ ...filters, branchId });
    }
    async getOrderById(id, actor) {
        const order = await order_repository_1.orderRepository.findById(id);
        if (!order)
            throw new errorHandler_middleware_1.AppError('Order not found', 404);
        if (actor) {
            await (0, backOfficeAccess_util_1.assertBackOfficeBranchAccess)(actor, this.getObjectIdString(order.branchId));
        }
        return order;
    }
    async confirmOrder(id, actor) {
        const order = await this.getOrderById(id, actor);
        if (order.status !== 'pending') {
            throw new errorHandler_middleware_1.AppError('Only pending orders can be confirmed', 400);
        }
        await this.decreaseOrderStock(order, actor.userId);
        let updated;
        try {
            updated = await order_repository_1.orderRepository.updateStatusIfCurrent(id, order.status, {
                status: 'confirmed',
                confirmedBy: actor.userId,
                confirmedAt: new Date(),
            });
        }
        catch (error) {
            await this.reconcileOrderStock(order, actor.userId);
            throw error;
        }
        if (!updated) {
            await this.reconcileOrderStock(order, actor.userId);
            throw new errorHandler_middleware_1.AppError('Order status changed by another request. Please reload and try again.', 409);
        }
        await this.recordTrackingEvent(id, 'confirmed', actor.userId, 'Order confirmed by back-office staff');
        return updated;
    }
    async updateStatus(id, status, actor) {
        const order = await this.getOrderById(id, actor);
        const nextStatuses = allowedTransitions[order.status];
        if (!nextStatuses.includes(status)) {
            throw new errorHandler_middleware_1.AppError(`Cannot change order status from ${order.status} to ${status}`, 400);
        }
        if (status === 'cancelled') {
            await this.ensureNoIssuedInvoice(id);
        }
        const update = { status };
        const isProcessingState = (s) => ['confirmed', 'preparing', 'delivering'].includes(s);
        // If moving from pending to a processing state, decrease stock
        if (order.status === 'pending' && isProcessingState(status)) {
            await this.decreaseOrderStock(order, actor.userId);
            if (status === 'confirmed') {
                update.confirmedBy = actor.userId;
                update.confirmedAt = new Date();
            }
        }
        // If moving from a processing state back to pending or to cancelled, increase/restore stock
        if (isProcessingState(order.status) && (status === 'pending' || status === 'cancelled')) {
            await this.increaseOrderStock(order, actor.userId, true);
        }
        let updated;
        try {
            updated = await order_repository_1.orderRepository.updateStatusIfCurrent(id, order.status, update);
        }
        catch (error) {
            await this.reconcileOrderStock(order, actor.userId);
            throw error;
        }
        if (!updated) {
            await this.reconcileOrderStock(order, actor.userId);
            throw new errorHandler_middleware_1.AppError('Order status changed by another request. Please reload and try again.', 409);
        }
        if (status === 'cancelled') {
            await this.restoreFlashSaleQuantities(order);
        }
        await this.recordTrackingEvent(id, status, actor.userId, `Order status changed from ${order.status} to ${status}`);
        // Tích điểm tích lũy cho khách hàng khi giao hàng thành công
        if (status === 'delivered' && updated.customerId) {
            const pointsEarned = Math.floor(updated.totalAmount / 10000);
            if (pointsEarned > 0) {
                try {
                    const user = await user_model_1.User.findById(updated.customerId).exec();
                    if (user) {
                        user.points = (user.points || 0) + pointsEarned;
                        user.lifetimePoints = (user.lifetimePoints || 0) + pointsEarned;
                        // Đọc ngưỡng thành viên từ system settings (fallback về hardcode nếu chưa có)
                        const [bronze, silver, gold, diamond] = await Promise.all([
                            system_setting_repository_1.systemSettingRepository.findByKey('loyalty_bronze_threshold'),
                            system_setting_repository_1.systemSettingRepository.findByKey('loyalty_silver_threshold'),
                            system_setting_repository_1.systemSettingRepository.findByKey('loyalty_gold_threshold'),
                            system_setting_repository_1.systemSettingRepository.findByKey('loyalty_diamond_threshold'),
                        ]);
                        const bronzeMin = Number(bronze?.value ?? 100);
                        const silverMin = Number(silver?.value ?? 300);
                        const goldMin = Number(gold?.value ?? 600);
                        const diamondMin = Number(diamond?.value ?? 1000);
                        // Tính toán lại hạng thành viên dựa trên điểm trọn đời
                        const lp = user.lifetimePoints;
                        let newLevel = 'new';
                        if (lp >= diamondMin) {
                            newLevel = 'diamond';
                        }
                        else if (lp >= goldMin) {
                            newLevel = 'gold';
                        }
                        else if (lp >= silverMin) {
                            newLevel = 'silver';
                        }
                        else if (lp >= bronzeMin) {
                            newLevel = 'bronze';
                        }
                        user.memberLevel = newLevel;
                        await user.save();
                    }
                }
                catch (err) {
                    console.error('[LOYALTY_POINTS_AWARD_FAILED]', err);
                }
            }
        }
        return updated;
    }
    async decreaseOrderStock(order, staffId) {
        const branchId = this.getObjectIdString(order.branchId);
        for (const item of this.aggregateOrderItems(order)) {
            const productId = item.productId;
            try {
                const result = await inventory_repository_1.inventoryRepository.applyOrderStockDeduction({
                    orderId: order._id.toString(),
                    branchId,
                    productId,
                    quantity: item.quantity,
                    updatedBy: staffId,
                });
                if (!result.inventory) {
                    throw new errorHandler_middleware_1.AppError(`Insufficient stock for product ${productId}`, 400);
                }
            }
            catch (error) {
                await this.increaseOrderStock(order, staffId, false);
                throw error;
            }
        }
    }
    async increaseOrderStock(order, staffId, allowLegacy) {
        const branchId = this.getObjectIdString(order.branchId);
        const restoredItems = [];
        for (const item of this.aggregateOrderItems(order)) {
            const productId = item.productId;
            try {
                const result = await inventory_repository_1.inventoryRepository.restoreOrderStockDeduction({
                    orderId: order._id.toString(),
                    branchId,
                    productId,
                    quantity: item.quantity,
                    updatedBy: staffId,
                    allowLegacy,
                });
                if (!result.inventory) {
                    throw new errorHandler_middleware_1.AppError(`Inventory record not found for product ${productId}`, 404);
                }
                if (result.restored) {
                    restoredItems.push({ productId, quantity: item.quantity });
                }
            }
            catch (error) {
                for (const restored of restoredItems.reverse()) {
                    await inventory_repository_1.inventoryRepository.applyOrderStockDeduction({
                        orderId: order._id.toString(),
                        branchId,
                        productId: restored.productId,
                        quantity: restored.quantity,
                        updatedBy: staffId,
                    });
                }
                throw error;
            }
        }
    }
    async reconcileOrderStock(order, staffId) {
        const current = await order_repository_1.orderRepository.findRawById(order._id.toString());
        if (!current)
            return;
        const shouldBeDeducted = [
            'confirmed',
            'preparing',
            'delivering',
            'delivered',
        ].includes(current.status);
        if (shouldBeDeducted) {
            await this.decreaseOrderStock(order, staffId);
        }
        else {
            await this.increaseOrderStock(order, staffId, false);
        }
    }
    aggregateOrderItems(order) {
        const quantities = new Map();
        for (const item of order.items) {
            const productId = this.getObjectIdString(item.productId);
            quantities.set(productId, (quantities.get(productId) || 0) + item.quantity);
        }
        return [...quantities.entries()].map(([productId, quantity]) => ({
            productId,
            quantity,
        }));
    }
    getObjectIdString(value) {
        if (value instanceof mongoose_1.Types.ObjectId)
            return value.toString();
        if (value && typeof value === 'object' && '_id' in value) {
            return String(value._id);
        }
        return String(value);
    }
    async recordTrackingEvent(orderId, status, changedBy, note) {
        let lastError;
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                await order_repository_1.orderRepository.addTrackingEvent(orderId, status, changedBy, note);
                return;
            }
            catch (error) {
                lastError = error;
            }
        }
        console.error('[ORDER_TRACKING_WRITE_FAILED]', {
            orderId,
            status,
            error: lastError,
        });
    }
    async ensureNoIssuedInvoice(orderId) {
        const invoice = await invoice_repository_1.invoiceRepository.findByOrderId(orderId);
        if (invoice) {
            throw new errorHandler_middleware_1.AppError('This order already has an issued invoice and cannot be cancelled. Use the return workflow after fulfillment.', 409);
        }
        await invoice_repository_1.invoiceRepository.releaseStaleOrderInvoiceReservation(orderId);
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
            phoneNumber: order.phoneNumber ?? null,
            paymentMethod: order.paymentMethod ?? 'COD',
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
                changedBy: this.buildTrackingActor(e.changedBy),
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
        await this.increaseOrderStock(order, customerId, false);
        await this.restoreFlashSaleQuantities(order);
        const updatedOrder = await order_repository_1.orderRepository.cancelByCustomer(orderId, customerId);
        if (!updatedOrder) {
            await this.reconcileOrderStock(order, customerId);
            throw new errorHandler_middleware_1.AppError('Order status changed and can no longer be cancelled', 409);
        }
        await this.recordTrackingEvent(orderId, 'cancelled', customerId, reason ?? 'Cancelled by customer');
        return this.buildCustomerOrderResponse(updatedOrder);
    }
    generateOrderCode() {
        const date = new Date();
        const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `ORD-${stamp}-${random}`;
    }
    async placeOrder(customerId, data) {
        // 1. Lấy giỏ hàng của user
        const cart = await cart_repository_1.cartRepository.findByUserId(customerId);
        if (!cart || cart.items.length === 0) {
            throw new errorHandler_middleware_1.AppError('Giỏ hàng trống, không thể đặt hàng.', 400);
        }
        // Lấy chiến dịch Flash Sale đang hoạt động của chi nhánh này
        const activeFlashSale = await flash_sale_repository_1.flashSaleRepository.findActiveFlashSale(data.branchId);
        const flashSaleIncrements = [];
        // 2. Kiểm tra tồn kho và lấy thông tin sản phẩm
        const orderItems = [];
        let totalAmountBeforeDiscount = 0;
        for (const item of cart.items) {
            const product = item.productId; // populated product
            if (!product || product.status === 'inactive') {
                throw new errorHandler_middleware_1.AppError(`Sản phẩm ${product?.name || 'không xác định'} không còn bán.`, 400);
            }
            // Check stock
            const stock = await inventory_repository_1.inventoryRepository.findInventoryItem(data.branchId, product._id.toString());
            if (!stock || stock.quantity < item.quantity) {
                throw new errorHandler_middleware_1.AppError(`Sản phẩm ${product.name} không đủ tồn kho tại chi nhánh đã chọn (Chỉ còn ${stock?.quantity ?? 0} sản phẩm).`, 400);
            }
            // Check if product is in the active flash sale and limit quantity is not exceeded
            let unitPrice = product.salePrice ?? 0;
            if (stock && stock.lastImportCost) {
                unitPrice = stock.lastImportCost;
            }
            let isFlashSaleApplied = false;
            if (activeFlashSale) {
                const flashProduct = activeFlashSale.products.find((p) => this.getObjectIdString(p.productId) === this.getObjectIdString(product._id));
                if (flashProduct &&
                    flashProduct.soldQuantity + item.quantity <= flashProduct.limitQuantity) {
                    unitPrice = flashProduct.flashSalePrice;
                    isFlashSaleApplied = true;
                }
            }
            const subtotal = unitPrice * item.quantity;
            totalAmountBeforeDiscount += subtotal;
            orderItems.push({
                productId: product._id,
                quantity: item.quantity,
                unitPrice,
                subtotal,
            });
            if (isFlashSaleApplied && activeFlashSale) {
                flashSaleIncrements.push({
                    flashSaleId: activeFlashSale._id.toString(),
                    productId: product._id.toString(),
                    quantity: item.quantity,
                });
            }
        }
        // 3. Xử lý voucher nếu có
        let totalAmount = totalAmountBeforeDiscount;
        let discountAmount = 0;
        let appliedVoucherId;
        if (data.voucherCode) {
            const voucher = await validation_service_1.promotionValidationService.validateVoucher(data.voucherCode, totalAmountBeforeDiscount, data.branchId);
            discountAmount = calculation_service_1.promotionCalculationService.calculateDiscount(voucher, totalAmountBeforeDiscount);
            totalAmount = Math.max(0, totalAmountBeforeDiscount - discountAmount);
            appliedVoucherId = voucher._id.toString();
        }
        // 4. Tạo mã đơn hàng
        const orderCode = this.generateOrderCode();
        // 5. Lưu order vào database
        const order = await order_model_1.Order.create({
            code: orderCode,
            customerId: new mongoose_1.Types.ObjectId(customerId),
            branchId: new mongoose_1.Types.ObjectId(data.branchId),
            items: orderItems,
            totalAmount,
            status: 'pending',
            deliveryAddress: data.shippingAddress,
            phoneNumber: data.phoneNumber,
            paymentMethod: data.paymentMethod,
            note: data.note,
        });
        // Cập nhật số lượng đã bán trong Flash Sale
        for (const inc of flashSaleIncrements) {
            await flash_sale_repository_1.flashSaleRepository.incrementProductSoldQuantity(inc.flashSaleId, inc.productId, inc.quantity);
        }
        // 6. Gắn tracking event ban đầu
        await order_repository_1.orderRepository.addTrackingEvent(order._id.toString(), 'order_placed', customerId, 'Đơn hàng được đặt thành công.');
        // 7. Áp dụng voucher (cập nhật trạng thái voucher và promotion usageCount)
        if (appliedVoucherId) {
            await usage_service_1.promotionUsageService.applyVoucher(appliedVoucherId, customerId, order._id.toString());
        }
        // 8. Xóa sạch giỏ hàng
        await cart_repository_1.cartRepository.clearCart(customerId);
        return this.buildCustomerOrderResponse(order);
    }
    buildTrackingActor(value) {
        if (value && typeof value === 'object' && '_id' in value) {
            const actor = value;
            return {
                userId: actor._id.toString(),
                fullName: actor.fullName ?? null,
                email: actor.email ?? null,
                role: actor.role ?? null,
            };
        }
        return value ? { userId: String(value) } : null;
    }
    async restoreFlashSaleQuantities(order) {
        try {
            const orderDate = order.createdAt;
            const branchId = this.getObjectIdString(order.branchId);
            for (const item of order.items) {
                const productId = this.getObjectIdString(item.productId);
                const flashSale = await flash_sale_repository_1.flashSaleRepository.findFlashSaleByOrderProduct(orderDate, branchId, productId);
                if (flashSale) {
                    await flash_sale_repository_1.flashSaleRepository.decrementProductSoldQuantity(flashSale._id.toString(), productId, item.quantity);
                }
            }
        }
        catch (err) {
            console.error('[RESTORE_FLASH_SALE_QUANTITIES_FAILED]', err);
        }
    }
}
exports.OrderService = OrderService;
exports.orderService = new OrderService();
//# sourceMappingURL=order.service.js.map