import { Request, Response } from 'express';
import { adminUserService } from './admin-user.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { listUsersSchema } from './admin-user.validation';

export class AdminUserController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const { query } = listUsersSchema.parse({
      query: req.query,
      body: req.body,
      params: req.params,
    });

    const result = await adminUserService.listUsers(query);
    sendSuccess(res, result, 'Users retrieved');
  });

  lock = asyncHandler(async (req: Request, res: Response) => {
    const user = await adminUserService.lockUser(String(req.params.id), req.user!.userId);
    sendSuccess(res, { user }, 'User locked');
  });

  unlock = asyncHandler(async (req: Request, res: Response) => {
    const user = await adminUserService.unlockUser(String(req.params.id));
    sendSuccess(res, { user }, 'User unlocked');
  });
}

export const adminUserController = new AdminUserController();
