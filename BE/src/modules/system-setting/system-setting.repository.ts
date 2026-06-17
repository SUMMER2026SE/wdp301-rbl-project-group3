import { ISystemSetting, SystemSetting } from '../../models/system-setting.model';

export interface SettingListFilters {
  group?: string;
  keyword?: string;
  isPublic?: boolean;
}

export interface PaginatedSettings {
  items: ISystemSetting[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SystemSettingRepository {
  async countAll(): Promise<number> {
    return SystemSetting.countDocuments().exec();
  }

  async insertMany(data: Partial<ISystemSetting>[]): Promise<void> {
    await SystemSetting.insertMany(data);
  }

  async create(data: Partial<ISystemSetting>): Promise<ISystemSetting> {
    return new SystemSetting(data).save();
  }

  async findPaginated(
    filters: SettingListFilters,
    page: number,
    limit: number
  ): Promise<PaginatedSettings> {
    const query: Record<string, unknown> = {};

    if (filters.group) query.group = filters.group;
    if (filters.isPublic !== undefined) query.isPublic = filters.isPublic;
    if (filters.keyword) {
      query.$or = [
        { key: { $regex: filters.keyword, $options: 'i' } },
        { label: { $regex: filters.keyword, $options: 'i' } },
        { description: { $regex: filters.keyword, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      SystemSetting.find(query).sort({ group: 1, key: 1 }).skip(skip).limit(limit).exec(),
      SystemSetting.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async findAllPublic(): Promise<ISystemSetting[]> {
    return SystemSetting.find({ isPublic: true }).sort({ group: 1, key: 1 }).exec();
  }

  async findByKey(key: string): Promise<ISystemSetting | null> {
    return SystemSetting.findOne({ key: key.toLowerCase() }).exec();
  }

  async updateByKey(
    key: string,
    data: Partial<ISystemSetting>
  ): Promise<ISystemSetting | null> {
    return SystemSetting.findOneAndUpdate({ key: key.toLowerCase() }, data, { new: true }).exec();
  }

  async deleteByKey(key: string): Promise<ISystemSetting | null> {
    return SystemSetting.findOneAndDelete({ key: key.toLowerCase() }).exec();
  }
}

export const systemSettingRepository = new SystemSettingRepository();
