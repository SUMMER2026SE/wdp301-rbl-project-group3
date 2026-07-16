"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlerController = exports.CrawlerController = void 0;
const crawler_service_1 = require("./crawler.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
class CrawlerController {
    constructor() {
        this.startManualCrawl = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            // Gọi crawler chạy nền (không await để không block request)
            crawler_service_1.crawlerService.startCrawl().catch(console.error);
            (0, response_util_1.sendSuccess)(res, null, 'Crawler has been started in the background', 202);
        });
        this.stopManualCrawl = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            await crawler_service_1.crawlerService.stopCrawl();
            (0, response_util_1.sendSuccess)(res, null, 'Crawler has been stopped', 200);
        });
        this.getCrawlerStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const status = crawler_service_1.crawlerService.getStatus();
            (0, response_util_1.sendSuccess)(res, status, 'Crawler status retrieved successfully', 200);
        });
    }
}
exports.CrawlerController = CrawlerController;
exports.crawlerController = new CrawlerController();
//# sourceMappingURL=crawler.controller.js.map