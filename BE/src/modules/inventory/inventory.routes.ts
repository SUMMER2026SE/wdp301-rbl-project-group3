import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
  createImportReceiptSchema,
  importReceiptIdParamSchema,
  listImportReceiptsSchema,
  listInventorySchema,
  updateImportReceiptSchema,
  createInventorySchema,
  updateInventorySchema,
  inventoryIdParamSchema,
  validate,
} from './inventory.validation';

const router = Router();
const backOfficeRoles = ['admin', 'branch_manager', 'staff'] as const;

router.use(authenticate);
router.use(authorize(...backOfficeRoles));

// Inventory Report / Manual stock CRUD
router.get('/', validate(listInventorySchema), inventoryController.getInventory);
router.post('/', validate(createInventorySchema), inventoryController.createInventory);
router.patch('/:id', validate(updateInventorySchema), inventoryController.updateInventory);
router.delete('/:id', validate(inventoryIdParamSchema), inventoryController.deleteInventory);

// Import history and receipts CRUD
router.get('/import-receipts', validate(listImportReceiptsSchema), inventoryController.getImportReceipts);
router.post('/import-receipts', validate(createImportReceiptSchema), inventoryController.createImportReceipt);
router.get(
  '/import-receipts/:id',
  validate(importReceiptIdParamSchema),
  inventoryController.getImportReceiptById
);
router.patch(
  '/import-receipts/:id',
  validate(updateImportReceiptSchema),
  inventoryController.updateImportReceipt
);
router.delete(
  '/import-receipts/:id',
  validate(importReceiptIdParamSchema),
  inventoryController.cancelImportReceipt
);

export default router;
