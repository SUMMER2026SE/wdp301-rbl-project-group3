import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

export class InventoryController {
  getInventory = asyncHandler(async (req: Request, res: Response) => {
    const inventory = await inventoryService.getInventory({
      branchId: req.query.branchId as string | undefined,
      productId: req.query.productId as string | undefined,
      lowStock: req.query.lowStock === 'true',
    });
    sendSuccess(res, { inventory }, 'Inventory retrieved');
  });

  createImportReceipt = asyncHandler(async (req: Request, res: Response) => {
    const receipt = await inventoryService.createImportReceipt({
      ...req.body,
      createdBy: req.user!.userId,
    });
    sendSuccess(res, { receipt }, 'Import receipt created and stock updated', 201);
  });

  getImportReceipts = asyncHandler(async (req: Request, res: Response) => {
    const receipts = await inventoryService.getImportReceipts({
      branchId: req.query.branchId as string | undefined,
    });
    sendSuccess(res, { receipts }, 'Import receipts retrieved');
  });
}

export const inventoryController = new InventoryController();
