import { Router } from 'express';
import { shiftController } from './shift.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
  createShiftTemplateSchema,
  updateShiftTemplateSchema,
  registerShiftSchema,
  approveRejectShiftSchema,
  validate,
} from './shift.validation';

const router = Router();

// Apply auth to all shift routes
router.use(authenticate);

// --- Shift Templates ---
router.post(
  '/templates',
  authorize('admin', 'branch_manager'),
  validate(createShiftTemplateSchema),
  shiftController.createTemplate
);

router.get(
  '/templates',
  authorize('admin', 'branch_manager', 'staff'),
  shiftController.getTemplates
);

router.put(
  '/templates/:id',
  authorize('admin', 'branch_manager'),
  validate(updateShiftTemplateSchema),
  shiftController.updateTemplate
);

router.delete(
  '/templates/:id',
  authorize('admin', 'branch_manager'),
  shiftController.deleteTemplate
);

// --- Shift Registrations ---
router.post(
  '/registrations',
  authorize('staff', 'branch_manager', 'admin'), // staff register themselves
  validate(registerShiftSchema),
  shiftController.registerShift
);

router.get(
  '/registrations',
  authorize('admin', 'branch_manager', 'staff'),
  shiftController.getRegistrations
);

router.delete(
  '/registrations/:id',
  authorize('admin', 'branch_manager', 'staff'),
  shiftController.cancelRegistration
);

router.post(
  '/registrations/:id/review',
  authorize('admin', 'branch_manager'),
  validate(approveRejectShiftSchema),
  shiftController.reviewRegistration
);

export default router;
