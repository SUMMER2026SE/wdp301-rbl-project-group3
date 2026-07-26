import { Router } from 'express';
import { favoriteController } from './favorite.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Đăng nhập mới có thể quản lý danh sách yêu thích
router.use(authenticate);

router.get('/', favoriteController.getFavorites);
router.post('/', favoriteController.addToFavorites);
router.delete('/:productId', favoriteController.removeFromFavorites);

export default router;
/**
 * Defines the HTTP endpoints and middleware chain for this feature module.
 * Feature boundary: favorite.
 */
