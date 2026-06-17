import { Router } from 'express';
import { productController } from './product.controller';
import { listProductsSchema, validate } from './product.validation';

const router = Router();

router.get('/', validate(listProductsSchema), productController.list);

export default router;
