import { Request, Response } from 'express';
import { orderService } from './order.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { OrderStatus } from '../../models/order.model';

export class OrderController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const orders = await orderService.getOrders({
      branchId: req.query.branchId as string | undefined,
      status: req.query.status as string | undefined,
    });
    sendSuccess(res, { orders }, 'Orders retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getOrderById(String(req.params.id));
    sendSuccess(res, { order }, 'Order retrieved');
  });

  confirm = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.confirmOrder(String(req.params.id), req.user!.userId);
    sendSuccess(res, { order }, 'Order confirmed');
  });

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.updateStatus(
      String(req.params.id),
      req.body.status as OrderStatus,
      req.user!.userId
    );
    sendSuccess(res, { order }, 'Order status updated');
  });
}

export const orderController = new OrderController();
