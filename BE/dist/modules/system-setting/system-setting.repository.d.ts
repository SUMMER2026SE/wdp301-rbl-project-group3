import { ISystemSetting } from '../../models/system-setting.model';
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
export declare class SystemSettingRepository {
    countAll(): Promise<number>;
    insertMany(data: Partial<ISystemSetting>[]): Promise<void>;
    create(data: Partial<ISystemSetting>): Promise<ISystemSetting>;
    findPaginated(filters: SettingListFilters, page: number, limit: number): Promise<PaginatedSettings>;
    findAllPublic(): Promise<ISystemSetting[]>;
    findAll(): Promise<ISystemSetting[]>;
    findByKey(key: string): Promise<ISystemSetting | null>;
    updateByKey(key: string, data: Partial<ISystemSetting>): Promise<ISystemSetting | null>;
    deleteByKey(key: string): Promise<ISystemSetting | null>;
}
export declare const systemSettingRepository: SystemSettingRepository;
//# sourceMappingURL=system-setting.repository.d.ts.map