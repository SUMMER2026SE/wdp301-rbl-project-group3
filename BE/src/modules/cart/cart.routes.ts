import { Router } from 'express';
import { cartController } from './cart.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
    validate,
    addToCartSchema,
    updateCartItemSchema,
    removeCartItemSchema,
} from './cart.validation';

const router = Router();

// Tất cả cart routes đều yêu cầu đăng nhập + role customer
router.use(authenticate, authorize('customer'));

// UC07 — Thêm vào giỏ hàng
router.post('/items', validate(addToCartSchema), cartController.addToCart);

// UC08 — Xem giỏ hàng
router.get('/', cartController.getCart);

// UC08 — Cập nhật số lượng
router.patch('/items/:itemId', validate(updateCartItemSchema), cartController.updateItem);

// UC08 — Xóa một item
router.delete('/items/:itemId', validate(removeCartItemSchema), cartController.removeItem);

// UC08 — Xóa toàn bộ giỏ
router.delete('/', cartController.clearCart);

export default router;
