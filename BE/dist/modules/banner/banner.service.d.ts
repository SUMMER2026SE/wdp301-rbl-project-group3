import { BannerFilters, PaginatedBanners } from './banner.repository';
import { IBanner } from '../../models/banner.model';
export declare class BannerService {
    private uploadBannerImage;
    listBanners(filters: BannerFilters, page: number, limit: number): Promise<PaginatedBanners>;
    getActiveBanners(): Promise<IBanner[]>;
    getBannerById(id: string): Promise<IBanner>;
    createBanner(data: any, file?: {
        buffer: Buffer;
        mimetype: string;
    }, creatorId?: string): Promise<IBanner>;
    updateBanner(id: string, data: any, file?: {
        buffer: Buffer;
        mimetype: string;
    }): Promise<IBanner | null>;
    deleteBanner(id: string): Promise<IBanner | null>;
}
export declare const bannerService: BannerService;
//# sourceMappingURL=banner.service.d.ts.map