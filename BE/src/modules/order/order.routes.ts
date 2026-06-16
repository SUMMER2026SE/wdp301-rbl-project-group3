import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { listOrdersSchema, orderIdParamSchema, updateOrderStatusSchema, validate } from './order.validation';

const router = Router();
const backOfficeRoles = ['superadmin', 'admin', 'manager', 'staff'] as const;

router.use(authenticate);
router.use(authorize(...backOfficeRoles));

router.get('/', validate(listOrdersSchema), orderController.getAll);
router.patch('/:id/confirm', validate(orderIdParamSchema), orderController.confirm);
router.patch('/:id/status', validate(updateOrderStatusSchema), orderController.updateStatus);
router.get('/:id', validate(orderIdParamSchema), orderController.getById);

export default router;
