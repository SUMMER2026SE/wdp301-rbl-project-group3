import { Router } from 'express';
import { productController } from './product.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { uploadProductImage } from '../../middlewares/upload.middleware';
import {
  createProductSchema,
  listProductsSchema,
  productIdParamSchema,
  updateProductSchema,
  suggestPriceBulkSchema,
  validate,
} from './product.validation';

const router = Router();
const backOfficeRoles = ['admin', 'branch_manager', 'staff'] as const;

router.get('/', validate(listProductsSchema), productController.list);
router.post('/suggest-price', authenticate, authorize(...backOfficeRoles), productController.suggestPrice);
router.post('/suggest-price-bulk', authenticate, authorize(...backOfficeRoles), validate(suggestPriceBulkSchema), productController.suggestPriceBulk);
router.get('/:id', validate(productIdParamSchema), productController.getById);

router.post(
  '/',
  authenticate,
  authorize(...backOfficeRoles),
  uploadProductImage,
  validate(createProductSchema),
  productController.create
);

router.patch(
  '/:id',
  authenticate,
  authorize(...backOfficeRoles),
  uploadProductImage,
  validate(updateProductSchema),
  productController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize(...backOfficeRoles),
  validate(productIdParamSchema),
  productController.delete
);

export default router;
/**
 * Defines the HTTP endpoints and middleware chain for this feature module.
 * Feature boundary: product.
 */
