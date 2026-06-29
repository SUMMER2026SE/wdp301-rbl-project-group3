import { Types } from 'mongoose';
import { ISystemSetting, SettingValueType } from '../../models/system-setting.model';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { systemSettingRepository } from './system-setting.repository';
import { DEFAULT_SYSTEM_SETTINGS } from './system-setting.defaults';
import { invalidateMaintenanceCache } from '../../middlewares/maintenanceMode.middleware';

export interface ListSettingsQuery {
  page: number;
  limit: number;
  group?: string;
  keyword?: string;
  isPublic?: boolean;
}

export interface ListSettingsResult {
  settings: ReturnType<typeof toSettingResponse>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function toSettingResponse(setting: ISystemSetting) {
  return {
    id: setting._id.toString(),
    key: setting.key,
    label: setting.label,
    group: setting.group,
    value: setting.value,
    valueType: setting.valueType,
    description: setting.description,
    isPublic: setting.isPublic,
    updatedBy: setting.updatedBy?.toString(),
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
}

function assertValueMatchesType(value: unknown, valueType: SettingValueType): void {
  if (valueType === 'string' && typeof value !== 'string') {
    throw new AppError('Value must be a string for valueType "string"', 400);
  }
  if (valueType === 'number' && (typeof value !== 'number' || Number.isNaN(value))) {
    throw new AppError('Value must be a number for valueType "number"', 400);
  }
  if (valueType === 'boolean' && typeof value !== 'boolean') {
    throw new AppError('Value must be a boolean for valueType "boolean"', 400);
  }
}

export class SystemSettingService {
  private async ensureDefaultSettings(): Promise<void> {
    // Upsert each default setting — only inserts if the key doesn't exist yet.
    // This allows adding new defaults without wiping existing data.
    const ops = DEFAULT_SYSTEM_SETTINGS.map((s) => ({
      updateOne: {
        filter: { key: s.key },
        update: { $setOnInsert: s },
        upsert: true,
      },
    }));
    await systemSettingRepository.bulkWrite(ops);

    // Clean up low_stock_threshold from database if it exists
    await systemSettingRepository.deleteByKey('low_stock_threshold');

    // Ensure vat_rate is public in DB
    await systemSettingRepository.updateByKey('vat_rate', { isPublic: true });
  }

  async listSettings(query: ListSettingsQuery): Promise<ListSettingsResult> {
    await this.ensureDefaultSettings();

    const { items, total, page, limit, totalPages } = await systemSettingRepository.findPaginated(
      {
        group: query.group,
        keyword: query.keyword,
        isPublic: query.isPublic,
      },
      query.page,
      query.limit
    );

    return {
      settings: items.map(toSettingResponse),
      pagination: { page, limit, total, totalPages },
    };
  }

  async getPublicSettings(): Promise<Record<string, string | number | boolean>> {
    await this.ensureDefaultSettings();

    const settings = await systemSettingRepository.findAllPublic();
    return settings.reduce<Record<string, string | number | boolean>>((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  async getSettingByKey(key: string) {
    await this.ensureDefaultSettings();

    const setting = await systemSettingRepository.findByKey(key);
    if (!setting) throw new AppError('Setting not found', 404);

    return toSettingResponse(setting);
  }

  async getSettingsByGroup() {
    await this.ensureDefaultSettings();

    const settings = await systemSettingRepository.findAll();
    const grouped = settings.reduce<Record<string, ReturnType<typeof toSettingResponse>[]>>(
      (acc, setting) => {
        const response = toSettingResponse(setting);
        if (!acc[setting.group]) acc[setting.group] = [];
        acc[setting.group].push(response);
        return acc;
      },
      {}
    );

    return { groups: grouped };
  }

  async createSetting(
    data: {
      key: string;
      label: string;
      group: ISystemSetting['group'];
      value: string | number | boolean;
      valueType: SettingValueType;
      description?: string;
      isPublic?: boolean;
    },
    adminUserId: string
  ) {
    assertValueMatchesType(data.value, data.valueType);

    const existing = await systemSettingRepository.findByKey(data.key);
    if (existing) throw new AppError('Setting key already exists', 409);

    const setting = await systemSettingRepository.create({
      ...data,
      key: data.key.toLowerCase(),
      isPublic: data.isPublic ?? false,
      updatedBy: new Types.ObjectId(adminUserId),
    });

    return toSettingResponse(setting);
  }

  async updateSetting(
    key: string,
    data: Partial<{
      label: string;
      group: ISystemSetting['group'];
      value: string | number | boolean;
      valueType: SettingValueType;
      description: string;
      isPublic: boolean;
    }>,
    adminUserId: string
  ) {
    const setting = await systemSettingRepository.findByKey(key);
    if (!setting) throw new AppError('Setting not found', 404);

    const nextValueType = data.valueType ?? setting.valueType;
    if (data.value !== undefined) {
      assertValueMatchesType(data.value, nextValueType);
    } else if (data.valueType !== undefined && data.valueType !== setting.valueType) {
      assertValueMatchesType(setting.value, data.valueType);
    }

    const updated = await systemSettingRepository.updateByKey(key, {
      ...data,
      updatedBy: new Types.ObjectId(adminUserId),
    });
    if (!updated) throw new AppError('Setting not found', 404);

    // Immediately invalidate maintenance cache when that key changes
    if (key === 'maintenance_mode') invalidateMaintenanceCache();

    return toSettingResponse(updated);
  }

  async bulkUpdateSettings(
    items: { key: string; value: string | number | boolean }[],
    adminUserId: string
  ) {
    const updated: ReturnType<typeof toSettingResponse>[] = [];
    const notFound: string[] = [];

    for (const item of items) {
      const setting = await systemSettingRepository.findByKey(item.key);
      if (!setting) {
        notFound.push(item.key);
        continue;
      }

      assertValueMatchesType(item.value, setting.valueType);

      const result = await systemSettingRepository.updateByKey(item.key, {
        value: item.value,
        updatedBy: new Types.ObjectId(adminUserId),
      });
      if (result) updated.push(toSettingResponse(result));
    }

    if (notFound.length > 0) {
      throw new AppError(`Settings not found: ${notFound.join(', ')}`, 404);
    }

    // Invalidate maintenance cache if that key was part of the bulk update
    const hasMaintenance = items.some((i) => i.key === 'maintenance_mode');
    if (hasMaintenance) invalidateMaintenanceCache();

    return { settings: updated };
  }

  async deleteSetting(key: string) {
    const setting = await systemSettingRepository.findByKey(key);
    if (!setting) throw new AppError('Setting not found', 404);

    const isDefault = DEFAULT_SYSTEM_SETTINGS.some((item) => item.key === setting.key);
    if (isDefault) {
      throw new AppError('Cannot delete a default system setting', 400);
    }

    const deleted = await systemSettingRepository.deleteByKey(key);
    if (!deleted) throw new AppError('Setting not found', 404);

    return toSettingResponse(deleted);
  }
}

export const systemSettingService = new SystemSettingService();
