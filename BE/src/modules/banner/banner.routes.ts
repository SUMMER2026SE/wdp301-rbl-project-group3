import { Router } from 'express';
import { bannerController } from './banner.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import { uploadBannerImage } from '../../middlewares/upload.middleware';
import {
  createBannerSchema,
  updateBannerSchema,
  bannerIdParamSchema,
  listBannersSchema,
  validate,
} from './banner.validation';

const router = Router();
const backOfficeRoles = ['admin', 'branch_manager', 'staff'] as const;
const managerRoles = ['admin', 'branch_manager'] as const;

// Public Route
router.get('/active', bannerController.getActive);

// Protected routes (Authentication required for all below)
router.use(authenticate);

// Staff and higher can list/get
router.get('/', authorize(...backOfficeRoles), validate(listBannersSchema), bannerController.list);
router.get('/:id', authorize(...backOfficeRoles), validate(bannerIdParamSchema), bannerController.getById);

// Manager and Admin can create, update, delete
router.post(
  '/',
  authorize(...managerRoles),
  uploadBannerImage,
  validate(createBannerSchema),
  bannerController.create
);

router.patch(
  '/:id',
  authorize(...managerRoles),
  uploadBannerImage,
  validate(updateBannerSchema),
  bannerController.update
);

router.delete(
  '/:id',
  authorize(...managerRoles),
  validate(bannerIdParamSchema),
  bannerController.delete
);

export default router;
