import { IBanner } from '../../models/banner.model';
export interface BannerFilters {
    status?: string;
    page?: number;
    limit?: number;
}
export interface PaginatedBanners {
    items: IBanner[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class BannerRepository {
    create(data: Partial<IBanner>): Promise<IBanner>;
    findPaginated(filters: BannerFilters, page: number, limit: number): Promise<PaginatedBanners>;
    findById(id: string): Promise<IBanner | null>;
    updateById(id: string, data: Partial<IBanner>): Promise<IBanner | null>;
    deleteById(id: string): Promise<IBanner | null>;
    findActiveBanners(): Promise<IBanner[]>;
}
export declare const bannerRepository: BannerRepository;
//# sourceMappingURL=banner.repository.d.ts.map