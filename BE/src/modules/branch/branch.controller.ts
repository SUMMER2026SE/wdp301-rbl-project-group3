import { Request, Response } from 'express';
import { branchService } from './branch.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

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
    const branch = await branchService.updateBranch(String(req.params.id), req.body);
    sendSuccess(res, { branch }, 'Branch updated');
  });

  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const branch = await branchService.deactivateBranch(String(req.params.id));
    sendSuccess(res, { branch }, 'Branch deactivated');
  });
}

export const branchController = new BranchController();
