import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createShiftTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    startTime: z.string().regex(timeRegex, { message: 'startTime must be in HH:MM format' }),
    endTime: z.string().regex(timeRegex, { message: 'endTime must be in HH:MM format' }),
    maxStaff: z.number().int().min(1).default(3),
  }),
});

export const updateShiftTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    startTime: z.string().regex(timeRegex, { message: 'startTime must be in HH:MM format' }).optional(),
    endTime: z.string().regex(timeRegex, { message: 'endTime must be in HH:MM format' }).optional(),
    maxStaff: z.number().int().min(1).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const registerShiftSchema = z.object({
  body: z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date string',
    }),
    shiftTemplateId: objectId,
    note: z.string().max(500).optional(),
  }),
});

export const approveRejectShiftSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected']),
    managerNote: z.string().max(500).optional(),
  }),
});

export { validate } from '../auth/auth.validation';
