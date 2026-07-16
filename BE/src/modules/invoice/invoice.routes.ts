import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { invoiceController } from './invoice.controller';
import {
  invoiceIdParamSchema,
  invoiceOrderIdParamSchema,
  validate,
} from './invoice.validation';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'branch_manager', 'staff'));

router.post(
  '/orders/:orderId',
  validate(invoiceOrderIdParamSchema),
  invoiceController.issue
);
router.get(
  '/orders/:orderId',
  validate(invoiceOrderIdParamSchema),
  invoiceController.getByOrder
);
router.get('/:id/pdf', validate(invoiceIdParamSchema), invoiceController.downloadPdf);
router.get('/:id', validate(invoiceIdParamSchema), invoiceController.getById);

export default router;
