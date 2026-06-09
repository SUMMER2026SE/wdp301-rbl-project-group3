import { User, IUser } from '../../models/user.model';

// Chỉ cho phép cập nhật các field profile an toàn
export type ProfileUpdateData = {
  fullName?: string;
  phone?: string;
  address?: string;
};

// Chỉ cho phép cập nhật avatar
export type AvatarUpdateData = {
  avatarUrl: string;
};

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  async updateProfileById(id: string, data: ProfileUpdateData): Promise<IUser | null> {
    // Chỉ pick các field được phép — tránh mass-assignment dù service có bug
    const safeData: ProfileUpdateData = {};
    if (data.fullName !== undefined) safeData.fullName = data.fullName;
    if (data.phone !== undefined) safeData.phone = data.phone;
    if (data.address !== undefined) safeData.address = data.address;

    return User.findByIdAndUpdate(id, { $set: safeData }, { new: true, runValidators: true }).exec();
  }

  async updateAvatarById(id: string, avatarUrl: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      { $set: { avatarUrl } },
      { new: true }
    ).exec();
  }
}

export const userRepository = new UserRepository();