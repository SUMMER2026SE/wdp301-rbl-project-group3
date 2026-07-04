export interface ParsedProduct {
    name: string;
    sku: string;
    brand?: string;
    price: number;
    unit: string;
    description: string;
    categoryName?: string;
}
export declare class AiService {
    parseProductData(rawText: string, retryCount?: number): Promise<ParsedProduct | null>;
    analyze(prompt: string, apiKey?: string): Promise<string>;
}
export declare const aiService: AiService;
//# sourceMappingURL=ai.service.d.ts.map