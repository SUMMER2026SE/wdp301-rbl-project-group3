import { ISystemSetting, SettingValueType } from '../../models/system-setting.model';
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
declare function toSettingResponse(setting: ISystemSetting): {
    id: string;
    key: string;
    label: string;
    group: import("../../models/system-setting.model").SettingGroup;
    value: string | number | boolean;
    valueType: SettingValueType;
    description: string | undefined;
    isPublic: boolean;
    updatedBy: string | undefined;
    createdAt: Date;
    updatedAt: Date;
};
export declare class SystemSettingService {
    private ensureDefaultSettings;
    listSettings(query: ListSettingsQuery): Promise<ListSettingsResult>;
    getPublicSettings(): Promise<Record<string, string | number | boolean>>;
    getSettingByKey(key: string): Promise<{
        id: string;
        key: string;
        label: string;
        group: import("../../models/system-setting.model").SettingGroup;
        value: string | number | boolean;
        valueType: SettingValueType;
        description: string | undefined;
        isPublic: boolean;
        updatedBy: string | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createSetting(data: {
        key: string;
        label: string;
        group: ISystemSetting['group'];
        value: string | number | boolean;
        valueType: SettingValueType;
        description?: string;
        isPublic?: boolean;
    }, adminUserId: string): Promise<{
        id: string;
        key: string;
        label: string;
        group: import("../../models/system-setting.model").SettingGroup;
        value: string | number | boolean;
        valueType: SettingValueType;
        description: string | undefined;
        isPublic: boolean;
        updatedBy: string | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateSetting(key: string, data: Partial<{
        label: string;
        group: ISystemSetting['group'];
        value: string | number | boolean;
        valueType: SettingValueType;
        description: string;
        isPublic: boolean;
    }>, adminUserId: string): Promise<{
        id: string;
        key: string;
        label: string;
        group: import("../../models/system-setting.model").SettingGroup;
        value: string | number | boolean;
        valueType: SettingValueType;
        description: string | undefined;
        isPublic: boolean;
        updatedBy: string | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteSetting(key: string): Promise<{
        id: string;
        key: string;
        label: string;
        group: import("../../models/system-setting.model").SettingGroup;
        value: string | number | boolean;
        valueType: SettingValueType;
        description: string | undefined;
        isPublic: boolean;
        updatedBy: string | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export declare const systemSettingService: SystemSettingService;
export {};
//# sourceMappingURL=system-setting.service.d.ts.map