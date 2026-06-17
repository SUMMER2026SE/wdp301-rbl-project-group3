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
  validate,
} from './product.validation';

const router = Router();
const backOfficeRoles = ['admin', 'branch_manager', 'staff'] as const;

router.get('/', validate(listProductsSchema), productController.list);
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
