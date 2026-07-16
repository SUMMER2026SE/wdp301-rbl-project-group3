import { IVoucher } from '../../../models/voucher.model';
export declare class PromotionCalculationService {
    /**
     * Tính toán số tiền được giảm dựa trên voucher và tổng giá trị đơn hàng
     * @param voucher Thông tin voucher đã được validate
     * @param orderValue Tổng giá trị đơn hàng
     * @returns Số tiền được giảm
     */
    calculateDiscount(voucher: IVoucher, orderValue: number): number;
}
export declare const promotionCalculationService: PromotionCalculationService;
//# sourceMappingURL=calculation.service.d.ts.map