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
      actor: {
        userId: req.user!.userId,
        role: req.user!.role,
      },
    });
    sendSuccess(res, { inventory }, 'Inventory retrieved');
  });

  createImportReceipt = asyncHandler(async (req: Request, res: Response) => {
    const receipt = await inventoryService.createImportReceipt({
      ...req.body,
      createdBy: req.user!.userId,
      actor: {
        userId: req.user!.userId,
        role: req.user!.role,
      },
    });
    sendSuccess(res, { receipt }, 'Import receipt created and stock updated', 201);
  });

  getImportReceipts = asyncHandler(async (req: Request, res: Response) => {
    const receipts = await inventoryService.getImportReceipts({
      branchId: req.query.branchId as string | undefined,
      status: req.query.status as string | undefined,
      actor: {
        userId: req.user!.userId,
        role: req.user!.role,
      },
    });
    sendSuccess(res, { receipts }, 'Import receipts retrieved');
  });

  getImportReceiptById = asyncHandler(async (req: Request, res: Response) => {
    const receipt = await inventoryService.getImportReceiptById(
      String(req.params.id),
      {
        userId: req.user!.userId,
        role: req.user!.role,
      }
    );
    sendSuccess(res, { receipt }, 'Import receipt retrieved');
  });

  updateImportReceipt = asyncHandler(async (req: Request, res: Response) => {
    const receipt = await inventoryService.updateImportReceipt(
      String(req.params.id),
      {
        ...req.body,
        updatedBy: req.user!.userId,
        actor: {
          userId: req.user!.userId,
          role: req.user!.role,
        },
      }
    );
    sendSuccess(res, { receipt }, 'Import receipt updated and stock reconciled');
  });

  cancelImportReceipt = asyncHandler(async (req: Request, res: Response) => {
    const receipt = await inventoryService.cancelImportReceipt(
      String(req.params.id),
      req.user!.userId,
      {
        userId: req.user!.userId,
        role: req.user!.role,
      }
    );
    sendSuccess(res, { receipt }, 'Import receipt cancelled and stock reversed');
  });
}

export const inventoryController = new InventoryController();
