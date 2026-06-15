import { Request, Response } from 'express';
import { promotionService, CallerContext } from './promotion.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { User } from '../../models/user.model';
import { AppError } from '../../middlewares/errorHandler.middleware';

async function buildCallerContext(req: Request): Promise<CallerContext> {
  const { userId, role } = req.user!;

  if (role === 'branch_manager') {
    const user = await User.findById(userId).select('branchId').exec();
    if (!user) throw new AppError('User not found', 404);
    return { userId, role, branchId: user.branchId?.toString() };
  }

  return { userId, role };
}

// Helper: lấy 1 query param dạng string an toàn
function queryStr(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0] as string | undefined;
  if (typeof value === 'string') return value;
  return undefined;
}

export class PromotionController {
  // ─── Promotion CRUD ────────────────────────────────────────────────────────

  createPromotion = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const result = await promotionService.createPromotion(req.body, caller);
    sendSuccess(res, { promotion: result }, 'Promotion created successfully', 201);
  });

  listPromotions = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const status = queryStr(req.query.status);
    const scope = queryStr(req.query.scope);
    const branchId = queryStr(req.query.branchId);
    const page = queryStr(req.query.page);
    const limit = queryStr(req.query.limit);

    const result = await promotionService.listPromotions(
      {
        status: status as any,
        scope: scope as any,
        branchId,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
      caller
    );
    sendSuccess(res, result, 'Promotions retrieved');
  });

  // Public — staff/customer xem promotion đang active
  listActivePromotions = asyncHandler(async (req: Request, res: Response) => {
    const branchId = queryStr(req.query.branchId);
    const page = queryStr(req.query.page);
    const limit = queryStr(req.query.limit);

    const result = await promotionService.listActivePromotions({
      branchId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result, 'Active promotions retrieved');
  });

  getPromotion = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const id = String(req.params.id);
    const result = await promotionService.getPromotion(id, caller);
    sendSuccess(res, { promotion: result }, 'Promotion retrieved');
  });

  updatePromotion = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const id = String(req.params.id);
    const result = await promotionService.updatePromotion(id, req.body, caller);
    sendSuccess(res, { promotion: result }, 'Promotion updated');
  });

  deletePromotion = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const id = String(req.params.id);
    const result = await promotionService.deletePromotion(id, caller);
    sendSuccess(res, null, result.message);
  });

  activatePromotion = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const id = String(req.params.id);
    const result = await promotionService.activatePromotion(id, caller);
    sendSuccess(res, { promotion: result }, 'Promotion activated');
  });

  deactivatePromotion = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const id = String(req.params.id);
    const result = await promotionService.deactivatePromotion(id, caller);
    sendSuccess(res, { promotion: result }, 'Promotion deactivated');
  });

  // ─── Voucher ───────────────────────────────────────────────────────────────

  generateVouchers = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const id = String(req.params.id);
    const { quantity } = req.body;
    const result = await promotionService.generateVouchers(id, quantity, caller);
    sendSuccess(res, result, result.message, 201);
  });

  listVouchers = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const id = String(req.params.id);
    const status = queryStr(req.query.status);
    const page = queryStr(req.query.page);
    const limit = queryStr(req.query.limit);

    const result = await promotionService.listVouchers(
      id,
      {
        status: status as any,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
      caller
    );
    sendSuccess(res, result, 'Vouchers retrieved');
  });

  disableVoucher = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const voucherId = String(req.params.voucherId);
    const result = await promotionService.disableVoucher(voucherId, caller);
    sendSuccess(res, { voucher: result }, 'Voucher disabled');
  });

  // Public — lookup voucher trước khi apply
  lookupVoucher = asyncHandler(async (req: Request, res: Response) => {
    const code = queryStr(req.query.code) ?? '';
    const result = await promotionService.lookupVoucher(code);
    sendSuccess(res, { voucher: result }, 'Voucher is valid');
  });
}

export const promotionController = new PromotionController();