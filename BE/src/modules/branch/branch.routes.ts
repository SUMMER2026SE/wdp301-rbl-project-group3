import { Router } from 'express';
import { branchController } from './branch.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
  branchIdParamSchema,
  createBranchSchema,
  listBranchesSchema,
  updateBranchSchema,
  validate,
} from './branch.validation';

const router = Router();
const branchReaders = ['admin', 'branch_manager', 'staff'] as const;

router.use(authenticate);

router.get(
  '/',
  authorize(...branchReaders),
  validate(listBranchesSchema),
  branchController.getAll
);
router.get(
  '/:id',
  authorize(...branchReaders),
  validate(branchIdParamSchema),
  branchController.getById
);
router.post(
  '/',
  authorize('admin'),
  validate(createBranchSchema),
  branchController.create
);
router.patch(
  '/:id',
  authorize('admin'),
  validate(updateBranchSchema),
  branchController.update
);
router.delete(
  '/:id',
  authorize('admin'),
  validate(branchIdParamSchema),
  branchController.deactivate
);

export default router;
