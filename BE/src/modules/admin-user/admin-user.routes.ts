import { Router } from 'express';
import { adminUserController } from './admin-user.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
  changeRoleSchema,
  listUsersSchema,
  userIdParamSchema,
  validate,
} from './admin-user.validation';

const router = Router();
const adminRoles = ['admin'] as const;

router.use(authenticate);
router.use(authorize(...adminRoles));

router.get('/', validate(listUsersSchema), adminUserController.list);
router.patch('/:id/lock', validate(userIdParamSchema), adminUserController.lock);
router.patch('/:id/unlock', validate(userIdParamSchema), adminUserController.unlock);
router.patch('/:id/role', validate(changeRoleSchema), adminUserController.changeRole);

export default router;
