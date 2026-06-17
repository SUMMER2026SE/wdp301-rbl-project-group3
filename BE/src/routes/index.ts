import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import branchRoutes from '../modules/branch/branch.routes';
import productRoutes from '../modules/product/product.routes';
import inventoryRoutes from '../modules/inventory/inventory.routes';
import orderRoutes from '../modules/order/order.routes';
import cartRoutes from '../modules/cart/cart.routes';
import promotionRoutes from '../modules/promotion/promotion.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/branches', branchRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/promotions', promotionRoutes);

export default router;
