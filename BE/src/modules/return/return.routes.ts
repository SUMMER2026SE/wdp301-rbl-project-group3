import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { returnController } from './return.controller';
import {
  cancelReturnSchema,
  completeReturnSchema,
  createReturnSchema,
  listReturnsSchema,
  rejectReturnSchema,
  resolveReturnSchema,
  returnIdParamSchema,
  updateReturnSchema,
  validate,
} from './return.validation';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'branch_manager', 'staff'));

router.get('/', validate(listReturnsSchema), returnController.list);
router.post('/', validate(createReturnSchema), returnController.create);
router.get('/:id', validate(returnIdParamSchema), returnController.getById);
router.patch('/:id', validate(updateReturnSchema), returnController.update);
router.delete('/:id', validate(cancelReturnSchema), returnController.cancel);
router.patch('/:id/approve', validate(resolveReturnSchema), returnController.approve);
router.patch('/:id/reject', validate(rejectReturnSchema), returnController.reject);
router.patch('/:id/complete', validate(completeReturnSchema), returnController.complete);

export default router;
