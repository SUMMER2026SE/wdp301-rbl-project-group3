export declare class CrawlerService {
    private isRunning;
    private crawlerInstance;
    getStatus(): {
        isRunning: boolean;
    };
    stopCrawl(): Promise<void>;
    startCrawl(): Promise<void>;
}
export declare const crawlerService: CrawlerService;
//# sourceMappingURL=crawler.service.d.ts.map