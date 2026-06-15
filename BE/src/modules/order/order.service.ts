import mongoose from 'mongoose';
import { orderRepository } from './order.repository';
import { cartRepository } from '../cart/cart.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { Inventory } from '../../models/inventory.model';
import { Product } from '../../models/product.model';
import { IOrder } from '../../models/order.model';

// ─── Request shape ────────────────────────────────────────────────────────────
export interface PlaceOrderInput {
    userId: string;
    branchId: string;
    shippingAddress: string;
    phoneNumber: string;
    note?: string;
    paymentMethod: 'COD' | 'banking' | 'momo' | 'vnpay';
    /** itemIds trong cart muốn đặt; nếu không truyền → đặt toàn bộ giỏ */
    selectedItemIds?: string[];
}

// ─── Response shape ───────────────────────────────────────────────────────────
function buildOrderResponse(order: IOrder) {
    return {
        orderId: order._id.toString(),
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        phoneNumber: order.phoneNumber,
        note: order.note,
        orderDate: order.orderDate,
        items: order.items.map((item) => ({
            itemId: item._id.toString(),
            productId: item.productId.toString(),
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
        })),
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
    };
}

export class OrderService {
    // ─── UC09: Đặt hàng ───────────────────────────────────────────────────────
    /**
     * Luồng:
     * 1. Lấy giỏ hàng, lọc các item muốn đặt
     * 2. Validate từng sản phẩm: tồn tại, active, còn hàng
     * 3. Mở DB transaction:
     *    a. Trừ tồn kho (Inventory) từng sản phẩm
     *    b. Tạo Order
     * 4. Xóa các item đã đặt khỏi giỏ hàng
     */
    async placeOrder(input: PlaceOrderInput): Promise<ReturnType<typeof buildOrderResponse>> {
        // 1. Lấy giỏ hàng
        const rawCart = await cartRepository.findRawByUserId(input.userId);
        if (!rawCart || rawCart.items.length === 0) {
            throw new AppError('Cart is empty', 400);
        }

        // Lọc items được chọn
        let selectedItems = rawCart.items;
        if (input.selectedItemIds && input.selectedItemIds.length > 0) {
            selectedItems = rawCart.items.filter((item) =>
                input.selectedItemIds!.includes(item._id.toString())
            );
            if (selectedItems.length === 0) {
                throw new AppError('No valid items selected', 400);
            }
        }

        // 2. Validate sản phẩm & tồn kho
        const productIds = selectedItems.map((i) => i.productId.toString());
        const products = await Product.find({
            _id: { $in: productIds },
            status: true,
        }).exec();

        if (products.length !== selectedItems.length) {
            throw new AppError('One or more products are unavailable', 400);
        }

        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        // Kiểm tra tồn kho theo branch
        for (const item of selectedItems) {
            const inv = await Inventory.findOne({
                branchId: input.branchId,
                productId: item.productId,
            }).exec();

            if (!inv || inv.quantity < item.quantity) {
                const product = productMap.get(item.productId.toString());
                throw new AppError(
                    `Insufficient stock for "${product?.productName ?? 'unknown product'}". Available: ${inv?.quantity ?? 0}`,
                    409
                );
            }
        }

        // 3. Tính tổng tiền
        const orderItems = selectedItems.map((item) => {
            const product = productMap.get(item.productId.toString())!;
            return {
                productId: item.productId.toString(),
                productName: product.productName,
                quantity: item.quantity,
                price: product.price, // snapshot giá hiện tại
            };
        });

        const totalAmount = orderItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
        );

        // 4. DB Transaction: trừ kho + tạo đơn
        const session = await mongoose.startSession();
        session.startTransaction();

        let order: IOrder;

        try {
            // Trừ tồn kho
            for (const item of orderItems) {
                const result = await Inventory.findOneAndUpdate(
                    {
                        branchId: input.branchId,
                        productId: item.productId,
                        quantity: { $gte: item.quantity }, // đảm bảo đủ hàng (race condition guard)
                    },
                    {
                        $inc: { quantity: -item.quantity },
                        $set: { lastUpdated: new Date() },
                    },
                    { session, new: true }
                ).exec();

                if (!result) {
                    throw new AppError(
                        `Race condition: stock of "${item.productName}" was just updated. Please try again.`,
                        409
                    );
                }
            }

            // Tạo đơn hàng
            order = await orderRepository.create({
                userId: input.userId,
                branchId: input.branchId,
                shippingAddress: input.shippingAddress,
                phoneNumber: input.phoneNumber,
                note: input.note,
                paymentMethod: input.paymentMethod,
                items: orderItems,
                totalAmount,
            });

            await session.commitTransaction();
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }

        // 5. Xóa các item đã đặt khỏi giỏ (ngoài transaction — không critical)
        const itemIdsToRemove = selectedItems.map((i) => i._id.toString());
        await cartRepository.removeItems(input.userId, itemIdsToRemove);

        return buildOrderResponse(order);
    }

    // ─── Xem chi tiết một đơn hàng ───────────────────────────────────────────
    async getOrderById(orderId: string, userId: string) {
        const order = await orderRepository.findByIdAndUserId(orderId, userId);
        if (!order) throw new AppError('Order not found', 404);
        return buildOrderResponse(order);
    }
}

export const orderService = new OrderService();
