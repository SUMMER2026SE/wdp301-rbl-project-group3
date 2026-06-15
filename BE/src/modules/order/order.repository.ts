import { Types } from 'mongoose';
import { Order, IOrder, OrderStatus } from '../../models/order.model';

export interface CreateOrderData {
    userId: string;
    branchId: string;
    shippingAddress: string;
    phoneNumber: string;
    note?: string;
    paymentMethod: 'COD' | 'banking' | 'momo' | 'vnpay';
    items: {
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
}

export class OrderRepository {
    async create(data: CreateOrderData): Promise<IOrder> {
        const order = new Order({
            userId: new Types.ObjectId(data.userId),
            branchId: new Types.ObjectId(data.branchId),
            shippingAddress: data.shippingAddress,
            phoneNumber: data.phoneNumber,
            note: data.note,
            paymentMethod: data.paymentMethod,
            totalAmount: data.totalAmount,
            status: 'pending',
            paymentStatus: 'pending',
            items: data.items.map((i) => ({
                _id: new Types.ObjectId(),
                productId: new Types.ObjectId(i.productId),
                productName: i.productName,
                quantity: i.quantity,
                price: i.price,
            })),
        });
        return order.save();
    }

    async findById(orderId: string): Promise<IOrder | null> {
        return Order.findById(orderId)
            .populate('branchId', 'branchName address phone')
            .exec();
    }

    async findByIdAndUserId(orderId: string, userId: string): Promise<IOrder | null> {
        return Order.findOne({
            _id: new Types.ObjectId(orderId),
            userId: new Types.ObjectId(userId),
        }).exec();
    }

    /** Lấy danh sách đơn hàng của user, mới nhất trước */
    async findByUserId(
        userId: string,
        page: number,
        limit: number,
        status?: OrderStatus
    ): Promise<{ orders: IOrder[]; total: number }> {
        const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
        if (status) filter.status = status;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            Order.countDocuments(filter),
        ]);

        return { orders, total };
    }

    /** Staff/Manager dùng: lấy đơn theo branchId */
    async findByBranchId(
        branchId: string,
        page: number,
        limit: number,
        status?: OrderStatus
    ): Promise<{ orders: IOrder[]; total: number }> {
        const filter: Record<string, unknown> = { branchId: new Types.ObjectId(branchId) };
        if (status) filter.status = status;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            Order.countDocuments(filter),
        ]);

        return { orders, total };
    }

    async updateStatus(orderId: string, status: OrderStatus): Promise<IOrder | null> {
        return Order.findByIdAndUpdate(
            orderId,
            { $set: { status } },
            { new: true }
        ).exec();
    }
}

export const orderRepository = new OrderRepository();
