import { Router } from 'express';
import { productController } from './product.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { createProductSchema, listProductsSchema, validate } from './product.validation';

const router = Router();
const backOfficeRoles = ['admin', 'branch_manager', 'staff'] as const;

router.get('/', validate(listProductsSchema), productController.getAll);
router.post('/', authenticate, authorize(...backOfficeRoles), validate(createProductSchema), productController.create);

export default router;
