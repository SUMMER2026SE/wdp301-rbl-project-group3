import { Router } from 'express';
import { productController } from './product.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { createProductSchema, listProductsSchema, validate } from './product.validation';

const router = Router();
const backOfficeRoles = ['superadmin', 'admin', 'manager', 'staff'] as const;

router.use(authenticate);
router.use(authorize(...backOfficeRoles));

router.get('/', validate(listProductsSchema), productController.getAll);
router.post('/', validate(createProductSchema), productController.create);

export default router;
