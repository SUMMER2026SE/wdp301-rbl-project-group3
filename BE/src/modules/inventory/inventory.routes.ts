import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
  createImportReceiptSchema,
  listImportReceiptsSchema,
  listInventorySchema,
  validate,
} from './inventory.validation';

const router = Router();
const backOfficeRoles = ['admin', 'branch_manager', 'staff'] as const;

router.use(authenticate);
router.use(authorize(...backOfficeRoles));

router.get('/', validate(listInventorySchema), inventoryController.getInventory);
router.get('/import-receipts', validate(listImportReceiptsSchema), inventoryController.getImportReceipts);
router.post('/import-receipts', validate(createImportReceiptSchema), inventoryController.createImportReceipt);

export default router;
