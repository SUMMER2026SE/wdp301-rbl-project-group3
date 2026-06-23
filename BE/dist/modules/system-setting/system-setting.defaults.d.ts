import { SettingGroup, SettingValueType } from '../../models/system-setting.model';
export interface DefaultSetting {
    key: string;
    label: string;
    group: SettingGroup;
    value: string | number | boolean;
    valueType: SettingValueType;
    description?: string;
    isPublic: boolean;
}
export declare const DEFAULT_SYSTEM_SETTINGS: DefaultSetting[];
//# sourceMappingURL=system-setting.defaults.d.ts.map