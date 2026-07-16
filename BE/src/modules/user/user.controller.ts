import { Request, Response } from 'express';
import { userService } from './user.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/errorHandler.middleware';

export class UserController {
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const profile = await userService.getProfile(userId);
    sendSuccess(res, { user: profile }, 'Profile retrieved');
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    // Chỉ lấy đúng các field được phép từ body
    const { fullName, phone, address } = req.body;
    const updated = await userService.updateProfile(userId, { fullName, phone, address });
    sendSuccess(res, { user: updated }, 'Profile updated');
  });

  updateAvatar = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    if (!req.file) throw new AppError('No file uploaded', 400);

    const avatarUrl = await userService.updateAvatar(
      userId,
      req.file.buffer,
      req.file.mimetype
    );
    sendSuccess(res, { avatarUrl }, 'Avatar updated');
  });
}

export const userController = new UserController();