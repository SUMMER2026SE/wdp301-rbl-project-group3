import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import adminUserRoutes from '../modules/admin-user/admin-user.routes';
import branchRoutes from '../modules/branch/branch.routes';
import categoryRoutes from '../modules/category/category.routes';
import productRoutes from '../modules/product/product.routes';
import inventoryRoutes from '../modules/inventory/inventory.routes';
import orderRoutes from '../modules/order/order.routes';
import statisticsRoutes from '../modules/statistics/statistics.routes';
import cartRoutes from '../modules/cart/cart.routes';
import promotionRoutes from '../modules/promotion/promotion.routes';
import {
  adminSystemSettingRoutes,
  publicSystemSettingRoutes,
} from '../modules/system-setting/system-setting.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/branches', branchRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/cart', cartRoutes);
router.use('/promotions', promotionRoutes);
router.use('/settings', publicSystemSettingRoutes);
router.use('/admin/settings', adminSystemSettingRoutes);

export default router;
