import { z } from 'zod';
import { validate } from '../auth/auth.validation';

const settingKey = z
  .string()
  .regex(/^[a-z][a-z0-9_]{1,49}$/, 'Key must be lowercase snake_case (2-50 chars)');

const settingGroup = z.enum(['general', 'order', 'delivery', 'inventory', 'payment', 'notification']);
const settingValueType = z.enum(['string', 'number', 'boolean']);

export const settingKeyParamSchema = z.object({
  params: z.object({
    key: settingKey,
  }),
});

export const listSettingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    group: settingGroup.optional(),
    keyword: z.string().max(100).optional(),
    isPublic: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  }),
});

export const createSettingSchema = z.object({
  body: z.object({
    key: settingKey,
    label: z.string().min(2).max(100),
    group: settingGroup,
    value: z.union([z.string().max(500), z.number(), z.boolean()]),
    valueType: settingValueType,
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const updateSettingSchema = z.object({
  params: z.object({
    key: settingKey,
  }),
  body: z.object({
    label: z.string().min(2).max(100).optional(),
    group: settingGroup.optional(),
    value: z.union([z.string().max(500), z.number(), z.boolean()]).optional(),
    valueType: settingValueType.optional(),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export { validate };
