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
const backOfficeRoles = ['superadmin', 'admin', 'manager', 'staff'] as const;

router.use(authenticate);
router.use(authorize(...backOfficeRoles));

router.get('/', validate(listBranchesSchema), branchController.getAll);
router.get('/:id', validate(branchIdParamSchema), branchController.getById);
router.post('/', validate(createBranchSchema), branchController.create);
router.patch('/:id', validate(updateBranchSchema), branchController.update);
router.delete('/:id', validate(branchIdParamSchema), branchController.deactivate);

export default router;
