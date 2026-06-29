export interface ParsedProduct {
    name: string;
    sku: string;
    salePrice: number;
    unit: string;
    description: string;
    categoryName?: string;
}
export declare class AiService {
    parseProductData(rawText: string): Promise<ParsedProduct | null>;
}
export declare const aiService: AiService;
//# sourceMappingURL=ai.service.d.ts.map