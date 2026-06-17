import { Request, Response } from 'express';
import { systemSettingService } from './system-setting.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { createSettingSchema, listSettingsSchema, updateSettingSchema } from './system-setting.validation';

export class SystemSettingController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const { query } = listSettingsSchema.parse({
      query: req.query,
      body: req.body,
      params: req.params,
    });

    const result = await systemSettingService.listSettings(query);
    sendSuccess(res, result, 'Settings retrieved');
  });

  getPublic = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await systemSettingService.getPublicSettings();
    sendSuccess(res, { settings }, 'Public settings retrieved');
  });

  getByKey = asyncHandler(async (req: Request, res: Response) => {
    const setting = await systemSettingService.getSettingByKey(String(req.params.key));
    sendSuccess(res, { setting }, 'Setting retrieved');
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const { body } = createSettingSchema.parse({
      query: req.query,
      body: req.body,
      params: req.params,
    });

    const setting = await systemSettingService.createSetting(body, req.user!.userId);
    sendSuccess(res, { setting }, 'Setting created', 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = updateSettingSchema.parse({
      query: req.query,
      body: req.body,
      params: req.params,
    });

    const setting = await systemSettingService.updateSetting(params.key, body, req.user!.userId);
    sendSuccess(res, { setting }, 'Setting updated');
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const setting = await systemSettingService.deleteSetting(String(req.params.key));
    sendSuccess(res, { setting }, 'Setting deleted');
  });
}

export const systemSettingController = new SystemSettingController();
