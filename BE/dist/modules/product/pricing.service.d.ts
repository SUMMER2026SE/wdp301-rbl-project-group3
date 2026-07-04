export declare class PricingService {
    suggestPrice(data: {
        costPrice: number;
        categoryId: string;
        competitorPrice?: number;
        name?: string;
        sku?: string;
    }): Promise<{
        suggestedPrice: number;
        confidence: number;
        reason: string;
        floorPrice: number;
    }>;
}
export declare const pricingService: PricingService;
//# sourceMappingURL=pricing.service.d.ts.map