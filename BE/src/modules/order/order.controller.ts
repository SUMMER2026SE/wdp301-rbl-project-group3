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

  getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.user!.userId;
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query['limit'] as string) || 10));
    const status = req.query['status'] as OrderStatus | undefined;

    const result = await orderService.getOrderHistory(customerId, page, limit, status);
    sendSuccess(res, result, 'Order history retrieved');
  });

  trackMyOrder = asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.trackOrder(
      req.params['orderId'] as string,
      req.user!.userId
    );
    sendSuccess(res, result, 'Order tracking retrieved');
  });

  getMyOrderById = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getCustomerOrderById(
      req.params['orderId'] as string,
      req.user!.userId
    );
    sendSuccess(res, { order }, 'Order retrieved');
  });

  cancelMyOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.cancelCustomerOrder(
      req.params['orderId'] as string,
      req.user!.userId,
      req.body.reason
    );
    sendSuccess(res, { order }, 'Order cancelled successfully');
  });
}

export const orderController = new OrderController();
