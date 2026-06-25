import { Request, Response } from 'express';
import { flashSaleService } from './flash-sale.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

function queryStr(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0] as string | undefined;
  if (typeof value === 'string') return value;
  return undefined;
}

export class FlashSaleController {
  createFlashSale = asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = req.user!;
    const caller = await flashSaleService.buildCallerContext(userId, role);
    const result = await flashSaleService.createFlashSale(caller, req.body);
    sendSuccess(res, { flashSale: result }, 'Flash sale created successfully', 201);
  });

  listFlashSales = asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = req.user!;
    const caller = await flashSaleService.buildCallerContext(userId, role);
    
    const status = queryStr(req.query.status);
    const scope = queryStr(req.query.scope);
    const branchId = queryStr(req.query.branchId);
    const page = queryStr(req.query.page);
    const limit = queryStr(req.query.limit);

    const result = await flashSaleService.listFlashSales(caller, {
      status,
      scope,
      branchId,
      page,
      limit,
    });
    
    sendSuccess(res, result, 'Flash sales retrieved successfully');
  });

  getFlashSale = asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = req.user!;
    const caller = await flashSaleService.buildCallerContext(userId, role);
    const id = String(req.params.id);
    
    const flashSale = await flashSaleService.getFlashSaleById(caller, id);
    sendSuccess(res, { flashSale }, 'Flash sale retrieved successfully');
  });

  updateFlashSale = asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = req.user!;
    const caller = await flashSaleService.buildCallerContext(userId, role);
    const id = String(req.params.id);
    
    const result = await flashSaleService.updateFlashSale(caller, id, req.body);
    sendSuccess(res, { flashSale: result }, 'Flash sale updated successfully');
  });

  deleteFlashSale = asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = req.user!;
    const caller = await flashSaleService.buildCallerContext(userId, role);
    const id = String(req.params.id);
    
    await flashSaleService.deleteFlashSale(caller, id);
    sendSuccess(res, null, 'Flash sale deleted successfully');
  });

  getActiveFlashSale = asyncHandler(async (req: Request, res: Response) => {
    const branchId = queryStr(req.query.branchId);
    const flashSale = await flashSaleService.getActiveFlashSale(branchId);

    if (!flashSale) {
      return sendSuccess(res, { flashSale: null }, 'No active flash sale found');
    }

    sendSuccess(res, { flashSale }, 'Active flash sale retrieved successfully');
  });
}

export const flashSaleController = new FlashSaleController();
