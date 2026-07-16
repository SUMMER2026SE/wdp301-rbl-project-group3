import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { employeeController } from './employee.controller';
import {
  createEmployeeSchema,
  employeeIdParamSchema,
  listEmployeesSchema,
  updateEmployeeSchema,
  validate,
} from './employee.validation';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'branch_manager'));

router.get('/', validate(listEmployeesSchema), employeeController.list);
router.post('/', validate(createEmployeeSchema), employeeController.create);
router.get('/:id', validate(employeeIdParamSchema), employeeController.getById);
router.patch('/:id', validate(updateEmployeeSchema), employeeController.update);
router.delete('/:id', validate(employeeIdParamSchema), employeeController.deactivate);

export default router;
