import { IVoucher } from '../../../models/voucher.model';

export class PromotionCalculationService {
  /**
   * Tính toán số tiền được giảm dựa trên voucher và tổng giá trị đơn hàng
   * @param voucher Thông tin voucher đã được validate
   * @param orderValue Tổng giá trị đơn hàng
   * @returns Số tiền được giảm
   */
  calculateDiscount(voucher: IVoucher, orderValue: number): number {
    let discount = 0;

    if (voucher.discountType === 'fixed_amount') {
      discount = voucher.discountValue;
    } else if (voucher.discountType === 'percentage') {
      discount = (orderValue * voucher.discountValue) / 100;
      if (voucher.maxDiscountAmount && discount > voucher.maxDiscountAmount) {
        discount = voucher.maxDiscountAmount;
      }
    }

    // Discount không được vượt quá giá trị đơn hàng
    if (discount > orderValue) {
      discount = orderValue;
    }

    return Math.floor(discount);
  }
}

export const promotionCalculationService = new PromotionCalculationService();
