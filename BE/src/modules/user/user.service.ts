import { userRepository } from './user.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { IUser } from '../../models/user.model';
import { cloudinary } from '../../config/cloudinary.config';

// Shape nhất quán trả về cho mọi endpoint profile
type ProfileResponse = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  avatarUrl?: string;
  authProvider: string;
  isEmailVerified: boolean;
  status: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

function toProfileResponse(user: IUser): ProfileResponse {
  return {
    id: user._id.toString(),
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
    updatedAt: user.updatedAt,
  };
}

export class UserService {
  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return toProfileResponse(user);
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; phone?: string; address?: string }
  ): Promise<ProfileResponse> {
    // Không cho phép body rỗng
    const hasUpdate = data.fullName !== undefined || data.phone !== undefined || data.address !== undefined;
    if (!hasUpdate) throw new AppError('No valid fields provided to update', 400);

    const user = await userRepository.updateProfileById(userId, data);
    if (!user) throw new AppError('User not found', 404);

    return toProfileResponse(user);
  }

  async updateAvatar(userId: string, fileBuffer: Buffer, mimetype: string): Promise<string> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    // Xoá avatar cũ trên Cloudinary nếu có (tránh orphan files)
    const publicId = `minimart/avatars/user_${userId}`;

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'minimart/avatars',
          public_id: `user_${userId}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          ],
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            return reject(error || new Error('Upload failed'));
          }
          resolve(uploadResult as { secure_url: string });
        }
      );
      uploadStream.end(fileBuffer);
    });

    const updatedUser = await userRepository.updateAvatarById(userId, result.secure_url);
    if (!updatedUser) throw new AppError('Failed to update avatar', 500);

    return result.secure_url;
  }
}

export const userService = new UserService();