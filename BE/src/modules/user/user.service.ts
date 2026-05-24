import { userRepository } from './user.repository';
import { authService } from '../auth/auth.service';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IUser } from '../../models/user.model';

export class UserService {
  async getProfile(userId: string): Promise<Partial<IUser>> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
      isEmailVerified: user.isEmailVerified,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; phone?: string; address?: string }
  ): Promise<Partial<IUser>> {
    const user = await userRepository.updateById(userId, data);
    if (!user) throw new AppError('User not found', 404);

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateAvatar(userId: string, fileBuffer: Buffer, mimetype: string): Promise<string> {
    return authService.uploadAvatar(userId, fileBuffer, mimetype);
  }
}

export const userService = new UserService();