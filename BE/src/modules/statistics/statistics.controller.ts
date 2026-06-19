import { Request, Response } from 'express';
import { statisticsService, CallerContext } from './statistics.service';
import { GroupBy } from './statistics.repository';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { User } from '../../models/user.model';
import { AppError } from '../../middlewares/errorHandler.middleware';

// Lấy CallerContext đầy đủ — branch_manager/staff cần branchId từ DB (JWT không chứa branchId)
async function buildCallerContext(req: Request): Promise<CallerContext> {
  const { userId, role } = req.user!;

  if (role === 'branch_manager' || role === 'staff') {
    const user = await User.findById(userId).select('branchId').exec();
    if (!user) throw new AppError('User not found', 404);
    return { userId, role, branchId: user.branchId?.toString() };
  }

  return { userId, role };
}

// Helper: lấy 1 query param dạng string an toàn (tránh lỗi string | string[])
function queryStr(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0] as string | undefined;
  if (typeof value === 'string') return value;
  return undefined;
}

export class StatisticsController {
  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARDS BY ROLE
  // ═══════════════════════════════════════════════════════════════════════════

  getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const from = queryStr(req.query.from);
    const to = queryStr(req.query.to);
    const groupBy = queryStr(req.query.groupBy) as GroupBy | undefined;

    const result = await statisticsService.getAdminDashboard(caller, { from, to, groupBy });
    sendSuccess(res, result, 'Admin dashboard retrieved');
  });

  getBranchDashboard = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const branchId = queryStr(req.query.branchId);
    const from = queryStr(req.query.from);
    const to = queryStr(req.query.to);
    const groupBy = queryStr(req.query.groupBy) as GroupBy | undefined;

    const result = await statisticsService.getBranchDashboard(caller, branchId, { from, to, groupBy });
    sendSuccess(res, result, 'Branch dashboard retrieved');
  });

  getStaffDashboard = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const from = queryStr(req.query.from);
    const to = queryStr(req.query.to);
    const groupBy = queryStr(req.query.groupBy) as GroupBy | undefined;

    const result = await statisticsService.getStaffDashboard(caller, { from, to, groupBy });
    sendSuccess(res, result, 'Staff dashboard retrieved');
  });

  getCustomerDashboard = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const from = queryStr(req.query.from);
    const to = queryStr(req.query.to);
    const groupBy = queryStr(req.query.groupBy) as GroupBy | undefined;

    const result = await statisticsService.getCustomerDashboard(caller, { from, to, groupBy });
    sendSuccess(res, result, 'Customer dashboard retrieved');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY ADMIN (Preserved for compatibility)
  // ═══════════════════════════════════════════════════════════════════════════

  getAdminOverview = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const result = await statisticsService.getAdminOverview(caller);
    sendSuccess(res, result, 'System statistics retrieved');
  });

  getUserRegistrationTrend = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const from = queryStr(req.query.from);
    const to = queryStr(req.query.to);
    const groupBy = queryStr(req.query.groupBy) as GroupBy | undefined;

    const result = await statisticsService.getUserRegistrationTrend(caller, { from, to, groupBy });
    sendSuccess(res, result, 'User registration trend retrieved');
  });

  getTopPromotions = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const limitStr = queryStr(req.query.limit);
    const limit = limitStr ? Number(limitStr) : 10;

    const result = await statisticsService.getTopPromotions(caller, limit);
    sendSuccess(res, result, 'Top promotions retrieved');
  });

  getVoucherUsageTrend = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const from = queryStr(req.query.from);
    const to = queryStr(req.query.to);
    const groupBy = queryStr(req.query.groupBy) as GroupBy | undefined;

    const result = await statisticsService.getVoucherUsageTrend(caller, { from, to, groupBy });
    sendSuccess(res, result, 'Voucher usage trend retrieved');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY BRANCH (Preserved for compatibility)
  // ═══════════════════════════════════════════════════════════════════════════

  getBranchOverview = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const branchId = queryStr(req.query.branchId);

    const result = await statisticsService.getBranchOverview(caller, branchId);
    sendSuccess(res, result, 'Branch statistics retrieved');
  });

  getBranchVoucherUsageTrend = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const branchId = queryStr(req.query.branchId);
    const from = queryStr(req.query.from);
    const to = queryStr(req.query.to);
    const groupBy = queryStr(req.query.groupBy) as GroupBy | undefined;

    const result = await statisticsService.getBranchVoucherUsageTrend(caller, branchId, {
      from,
      to,
      groupBy,
    });
    sendSuccess(res, result, 'Branch voucher usage trend retrieved');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY PERSONAL (Preserved for compatibility)
  // ═══════════════════════════════════════════════════════════════════════════

  getMyStatistics = asyncHandler(async (req: Request, res: Response) => {
    const caller = await buildCallerContext(req);
    const pageStr = queryStr(req.query.page);
    const limitStr = queryStr(req.query.limit);

    const result = await statisticsService.getMyStatistics(caller, {
      page: pageStr ? Number(pageStr) : undefined,
      limit: limitStr ? Number(limitStr) : undefined,
    });
    sendSuccess(res, result, 'Your statistics retrieved');
  });
}

export const statisticsController = new StatisticsController();
