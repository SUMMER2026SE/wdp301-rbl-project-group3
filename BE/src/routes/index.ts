import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import promotionRoutes from '../modules/promotion/promotion.routes';
import cartRoutes from '../modules/cart/cart.routes';
import orderRoutes from '../modules/order/order.routes';
import statisticsRoutes from '../modules/statistics/statistics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/promotions', promotionRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/statistics', statisticsRoutes);

export default router;