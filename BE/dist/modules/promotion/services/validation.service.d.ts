import { IVoucher } from '../../../models/voucher.model';
export declare class PromotionValidationService {
    /**
     * Kiểm tra tính hợp lệ của mã giảm giá
     */
    validateVoucher(code: string, orderValue: number, branchId?: string): Promise<IVoucher>;
}
export declare const promotionValidationService: PromotionValidationService;
//# sourceMappingURL=validation.service.d.ts.map