import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { validate, placeOrderSchema, getOrderSchema } from './order.validation';

const router = Router();

// UC09 — Đặt hàng (customer only)
router.post(
    '/',
    authenticate,
    authorize('customer'),
    validate(placeOrderSchema),
    orderController.placeOrder
);

// GET /orders/:orderId — xem chi tiết đơn
router.get(
    '/:orderId',
    authenticate,
    authorize('customer'),
    validate(getOrderSchema),
    orderController.getOrder
);

export default router;
