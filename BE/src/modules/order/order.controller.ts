import { Request, Response } from 'express';
import { orderService } from './order.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

export class OrderController {
    // UC09 — POST /api/orders
    placeOrder = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const {
            branchId,
            shippingAddress,
            phoneNumber,
            note,
            paymentMethod,
            selectedItemIds,
        } = req.body;

        const order = await orderService.placeOrder({
            userId,
            branchId,
            shippingAddress,
            phoneNumber,
            note,
            paymentMethod: paymentMethod ?? 'COD',
            selectedItemIds,
        });

        sendSuccess(res, order, 'Order placed successfully', 201);
    });

    // GET /api/orders/:orderId — xem chi tiết đơn (dùng cho UC10 track cũng gọi endpoint này)
    getOrder = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const orderId = req.params['orderId'] as string;

        const order = await orderService.getOrderById(orderId, userId);
        sendSuccess(res, order, 'Order retrieved successfully');
    });
}

export const orderController = new OrderController();
