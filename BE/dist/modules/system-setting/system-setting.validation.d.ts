import { z } from 'zod';
import { validate } from '../auth/auth.validation';
export declare const settingKeyParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        key: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const listSettingsSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        group: z.ZodOptional<z.ZodEnum<{
            inventory: "inventory";
            general: "general";
            order: "order";
            delivery: "delivery";
            payment: "payment";
            notification: "notification";
        }>>;
        keyword: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodOptional<z.ZodPipe<z.ZodEnum<{
            true: "true";
            false: "false";
        }>, z.ZodTransform<boolean, "true" | "false">>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createSettingSchema: z.ZodObject<{
    body: z.ZodObject<{
        key: z.ZodString;
        label: z.ZodString;
        group: z.ZodEnum<{
            inventory: "inventory";
            general: "general";
            order: "order";
            delivery: "delivery";
            payment: "payment";
            notification: "notification";
        }>;
        value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean]>;
        valueType: z.ZodEnum<{
            string: "string";
            number: "number";
            boolean: "boolean";
        }>;
        description: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateSettingSchema: z.ZodObject<{
    params: z.ZodObject<{
        key: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        group: z.ZodOptional<z.ZodEnum<{
            inventory: "inventory";
            general: "general";
            order: "order";
            delivery: "delivery";
            payment: "payment";
            notification: "notification";
        }>>;
        value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
        valueType: z.ZodOptional<z.ZodEnum<{
            string: "string";
            number: "number";
            boolean: "boolean";
        }>>;
        description: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const bulkUpdateSettingsSchema: z.ZodObject<{
    body: z.ZodObject<{
        settings: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean]>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export { validate };
//# sourceMappingURL=system-setting.validation.d.ts.map