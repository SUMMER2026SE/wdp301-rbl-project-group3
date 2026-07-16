import { Request, Response } from 'express';
import { branchService } from './branch.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/errorHandler.middleware';

export class BranchController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const branch = await branchService.createBranch(req.body);
    sendSuccess(res, { branch }, 'Branch created', 201);
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const branches = await branchService.getBranches({
      status: req.query.status as string | undefined,
      keyword: req.query.keyword as string | undefined,
    });
    sendSuccess(res, { branches }, 'Branches retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const branch = await branchService.getBranchById(String(req.params.id));
    sendSuccess(res, { branch }, 'Branch retrieved');
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const caller = (req as any).user;
    if (!caller) {
      throw new AppError('Authentication required', 401);
    }
    const branch = await branchService.updateBranch(String(req.params.id), req.body, {
      role: caller.role,
      branchId: caller.branchId?.toString(),
      email: caller.email,
    });
    sendSuccess(res, { branch }, 'Branch updated');
  });

  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const branch = await branchService.deactivateBranch(String(req.params.id));
    sendSuccess(res, { branch }, 'Branch deactivated');
  });

  getQuickStats = asyncHandler(async (req: Request, res: Response) => {
    const caller = (req as any).user;
    if (!caller) {
      throw new AppError('Authentication required', 401);
    }
    const stats = await branchService.getBranchQuickStats(String(req.params.id), {
      role: caller.role,
      branchId: caller.branchId?.toString(),
    });
    sendSuccess(res, stats, 'Branch statistics retrieved');
  });
}

export const branchController = new BranchController();
