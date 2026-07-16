import { Router } from 'express';
import { categoryController } from './category.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
  categoryIdParamSchema,
  createCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
  validate,
} from './category.validation';

const router = Router();
const adminRoles = ['admin'] as const;

router.get('/', validate(listCategoriesSchema), categoryController.getAll);
router.get('/:id', validate(categoryIdParamSchema), categoryController.getById);

router.post('/', authenticate, authorize(...adminRoles), validate(createCategorySchema), categoryController.create);
router.patch(
  '/:id',
  authenticate,
  authorize(...adminRoles),
  validate(updateCategorySchema),
  categoryController.update
);
router.delete(
  '/:id',
  authenticate,
  authorize(...adminRoles),
  validate(categoryIdParamSchema),
  categoryController.delete
);

export default router;
