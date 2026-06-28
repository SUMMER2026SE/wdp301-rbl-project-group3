"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlerConfig = void 0;
exports.crawlerConfig = {
    // URLs gốc để bắt đầu cào
    startUrls: [
        'https://winmart.vn/',
    ],
    // Cấu hình giới hạn
    maxRequestsPerCrawl: 1000, // Cào tối đa 1000 sản phẩm mỗi lần để tránh bị block hoặc quá tải
    maxConcurrency: 1, // Số lượng tab mở đồng thời (Set = 1 để tránh Gemini Rate Limit)
    requestHandlerTimeoutSecs: 60,
};
//# sourceMappingURL=crawler.config.js.map