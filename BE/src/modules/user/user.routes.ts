import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { uploadAvatar } from '../../middlewares/upload.middleware';
import { validate, updateProfileSchema } from './user.validation';

const router = Router();

// Tất cả routes đều yêu cầu đăng nhập
router.use(authenticate);

router.get('/me', userController.getProfile);
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);
router.patch('/me/avatar', uploadAvatar, userController.updateAvatar);

export default router;