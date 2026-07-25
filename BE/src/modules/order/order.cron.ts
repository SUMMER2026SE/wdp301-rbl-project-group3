import cron from 'node-cron';
import { systemSettingRepository } from '../system-setting/system-setting.repository';
import { Order } from '../../models/order.model';
import { orderService } from './order.service';

/**
 * Cron Job tự động kiểm tra và hủy các đơn hàng ở trạng thái pending quá hạn
 * dựa trên tham số cài đặt hệ thống `order_cancel_timeout_minutes`
 */
export const initOrderAutoCancelCron = () => {
    // Chạy định kỳ mỗi 1 phút một lần
    cron.schedule('*/1 * * * *', async () => {
        try {
            const timeoutSetting = await systemSettingRepository.findByKey('order_cancel_timeout_minutes');
            const timeoutMinutes = Number(timeoutSetting?.value ?? 30);
            if (timeoutMinutes <= 0) return;

            const cutoffDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

            // Lấy danh sách các đơn hàng ở trạng thái pending, chưa thanh toán và tạo quá thời gian quy định
            const overdueOrders = await Order.find({
                status: 'pending',
                paymentStatus: { $ne: 'paid' },
                createdAt: { $lt: cutoffDate },
            }).select('_id code').exec();

            if (overdueOrders.length > 0) {
                console.log(`[ORDER_AUTO_CANCEL_CRON] Phát hiện ${overdueOrders.length} đơn hàng quá hạn (${timeoutMinutes} phút). Đang tiến hành tự động hủy...`);
                for (const order of overdueOrders) {
                    await orderService.autoCancelOverdueOrder(order._id.toString(), timeoutMinutes);
                }
            }
        } catch (err) {
            console.error('[ORDER_AUTO_CANCEL_CRON_ERROR]', err);
        }
    });

    console.log('Order Auto-Cancel Cron Job initialized (Scheduled for every 1 minute check).');
};
