import { Request, Response } from 'express';
import { promotionService } from './services/promotion.service';
import { couponService } from './services/coupon.service';
import { promotionValidationService } from './services/validation.service';
import { promotionCalculationService } from './services/calculation.service';
import { promotionUsageService } from './services/usage.service';
import { CallerContext } from './types';
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
    const result = await couponService.generateVouchers(id, quantity, caller);
    sendSuccess(res, result, result.message, 201);
  });

  listVouchers = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const id = String(req.params.id);
    const status = queryStr(req.query.status);
    const page = queryStr(req.query.page);
    const limit = queryStr(req.query.limit);

    const result = await couponService.listVouchers(
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
    const result = await couponService.disableVoucher(voucherId, caller);
    sendSuccess(res, { voucher: result }, 'Voucher disabled');
  });

  // Public — lookup voucher trước khi apply (validate và calculate discount)
  lookupVoucher = asyncHandler(async (req: Request, res: Response) => {
    const code = queryStr(req.query.code) ?? '';
    const orderValue = Number(queryStr(req.query.orderValue)) || 0;
    const branchId = queryStr(req.query.branchId);

    const voucher = await promotionValidationService.validateVoucher(code, orderValue, branchId);
    const discount = promotionCalculationService.calculateDiscount(voucher, orderValue);
    
    const response = await couponService.getVoucherResponse(voucher);
    
    sendSuccess(res, { voucher: response, discountAmount: discount }, 'Voucher is valid');
  });

  // Áp dụng voucher thực tế (khi thanh toán/tạo đơn hàng)
  applyVoucher = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = await buildCallerContext(req);
    const code = req.body.code;
    const orderValue = Number(req.body.orderValue) || 0;
    const branchId = req.body.branchId;
    const orderId = req.body.orderId;

    if (!orderId) {
      throw new AppError('orderId is required to apply voucher', 400);
    }

    const voucher = await promotionValidationService.validateVoucher(code, orderValue, branchId);
    const discount = promotionCalculationService.calculateDiscount(voucher, orderValue);
    
    const updatedVoucher = await promotionUsageService.applyVoucher(voucher._id.toString(), userId, orderId);
    const response = await couponService.getVoucherResponse(updatedVoucher!);

    sendSuccess(res, { voucher: response, discountAmount: discount }, 'Voucher applied successfully');
  });
}

export const promotionController = new PromotionController();