export declare class CompetitorProductService {
    getCompetitorProducts(query: {
        page?: number;
        limit?: number;
        keyword?: string;
    }): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("../../models/competitor-product.model").ICompetitorProduct, {}, import("mongoose").DefaultSchemaOptions> & import("../../models/competitor-product.model").ICompetitorProduct & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    importToCatalog(ids: string[]): Promise<{
        importedCount: number;
    }>;
}
export declare const competitorProductService: CompetitorProductService;
//# sourceMappingURL=competitor-product.service.d.ts.map