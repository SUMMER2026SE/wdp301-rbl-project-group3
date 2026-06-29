import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { listOrdersSchema, orderIdParamSchema, updateOrderStatusSchema, myOrderIdParamSchema, myOrdersSchema, cancelOrderSchema, placeOrderSchema, validate } from './order.validation';

const router = Router();
const backOffice = authorize('admin', 'branch_manager', 'staff');
const customerOnly = authorize('customer');

router.use(authenticate);

router.get('/my', customerOnly, validate(myOrdersSchema), orderController.getMyOrders);
router.get('/my/:orderId/tracking', customerOnly, validate(myOrderIdParamSchema), orderController.trackMyOrder);
router.patch('/my/:orderId/cancel', customerOnly, validate(cancelOrderSchema), orderController.cancelMyOrder);
router.get('/my/:orderId', customerOnly, validate(myOrderIdParamSchema), orderController.getMyOrderById);
router.post('/', customerOnly, validate(placeOrderSchema), orderController.placeOrder);

router.get('/', backOffice, validate(listOrdersSchema), orderController.getAll);
router.patch('/:id/confirm', backOffice, validate(orderIdParamSchema), orderController.confirm);
router.patch('/:id/status', backOffice, validate(updateOrderStatusSchema), orderController.updateStatus);
router.get('/:id', backOffice, validate(orderIdParamSchema), orderController.getById);

export default router;
