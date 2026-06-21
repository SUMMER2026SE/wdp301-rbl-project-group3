import { Router } from 'express';
import { systemSettingController } from './system-setting.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
  bulkUpdateSettingsSchema,
  createSettingSchema,
  listSettingsSchema,
  settingKeyParamSchema,
  updateSettingSchema,
  validate,
} from './system-setting.validation';

const adminRouter = Router();
const publicRouter = Router();
const adminRoles = ['admin'] as const;

publicRouter.get('/public', systemSettingController.getPublic);

adminRouter.use(authenticate);
adminRouter.use(authorize(...adminRoles));

adminRouter.get('/', validate(listSettingsSchema), systemSettingController.list);
adminRouter.get('/groups', systemSettingController.getByGroup);
adminRouter.patch('/bulk', validate(bulkUpdateSettingsSchema), systemSettingController.bulkUpdate);
adminRouter.get('/:key', validate(settingKeyParamSchema), systemSettingController.getByKey);
adminRouter.post('/', validate(createSettingSchema), systemSettingController.create);
adminRouter.patch('/:key', validate(updateSettingSchema), systemSettingController.update);
adminRouter.delete('/:key', validate(settingKeyParamSchema), systemSettingController.delete);

export { adminRouter as adminSystemSettingRoutes, publicRouter as publicSystemSettingRoutes };
