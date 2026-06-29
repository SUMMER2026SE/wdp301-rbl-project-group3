import mongoose, { Document, Types } from 'mongoose';
export type SettingGroup = 'general' | 'order' | 'delivery' | 'inventory' | 'payment' | 'notification' | 'loyalty';
export type SettingValueType = 'string' | 'number' | 'boolean';
export interface ISystemSetting extends Document {
    _id: Types.ObjectId;
    key: string;
    label: string;
    group: SettingGroup;
    value: string | number | boolean;
    valueType: SettingValueType;
    description?: string;
    isPublic: boolean;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SystemSetting: mongoose.Model<ISystemSetting, {}, {}, {}, mongoose.Document<unknown, {}, ISystemSetting, {}, mongoose.DefaultSchemaOptions> & ISystemSetting & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISystemSetting>;
//# sourceMappingURL=system-setting.model.d.ts.map