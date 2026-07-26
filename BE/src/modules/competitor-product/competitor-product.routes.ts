import { Router } from 'express';
import { competitorProductController } from './competitor-product.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

// Only admin can view and import competitor products
router.get('/', authenticate, authorize('admin'), competitorProductController.getCompetitorProducts);
router.post('/import', authenticate, authorize('admin'), competitorProductController.importToCatalog);
router.post('/delete', authenticate, authorize('admin'), competitorProductController.deleteCompetitorProducts);

export default router;
/**
 * Defines the HTTP endpoints and middleware chain for this feature module.
 * Feature boundary: competitor-product.
 */
