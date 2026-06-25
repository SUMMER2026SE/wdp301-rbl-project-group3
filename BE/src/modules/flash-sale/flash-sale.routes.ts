import { Router } from 'express';
import { flashSaleController } from './flash-sale.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
  validate,
  createFlashSaleSchema,
  updateFlashSaleSchema,
  flashSaleIdParamSchema,
  listFlashSalesSchema,
} from './flash-sale.validation';

const router = Router();

// ─── Public ──────────────────────────────────────────────────────────────────
router.get('/active', flashSaleController.getActiveFlashSale);

// ─── Back-Office ─────────────────────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  authorize('admin', 'branch_manager', 'staff'),
  validate(listFlashSalesSchema),
  flashSaleController.listFlashSales
);

router.post(
  '/',
  authenticate,
  authorize('admin', 'branch_manager'),
  validate(createFlashSaleSchema),
  flashSaleController.createFlashSale
);

router.get(
  '/:id',
  authenticate,
  authorize('admin', 'branch_manager', 'staff'),
  validate(flashSaleIdParamSchema),
  flashSaleController.getFlashSale
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'branch_manager'),
  validate(updateFlashSaleSchema),
  flashSaleController.updateFlashSale
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'branch_manager'),
  validate(flashSaleIdParamSchema),
  flashSaleController.deleteFlashSale
);

export default router;
