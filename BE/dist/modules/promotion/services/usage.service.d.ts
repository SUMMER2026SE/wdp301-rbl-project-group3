export declare class PromotionUsageService {
    /**
     * Đánh dấu voucher là đã sử dụng, gắn với user và order, đồng thời tăng usageCount của promotion
     */
    applyVoucher(voucherId: string, userId: string, orderId: string): Promise<import("../../../models/voucher.model").IVoucher | null>;
}
export declare const promotionUsageService: PromotionUsageService;
//# sourceMappingURL=usage.service.d.ts.map