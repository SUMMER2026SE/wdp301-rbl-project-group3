"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCrawlerCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const crawler_service_1 = require("./crawler.service");
// Chạy vào lúc 2:00 sáng mỗi ngày
const initCrawlerCron = () => {
    node_cron_1.default.schedule('0 2 * * *', () => {
        console.log('--- Triggering daily Winmart Crawler via Cron Job ---');
        crawler_service_1.crawlerService.startCrawl().catch(console.error);
    });
    console.log('Crawler Cron Job initialized (Scheduled for 02:00 AM daily).');
};
exports.initCrawlerCron = initCrawlerCron;
//# sourceMappingURL=crawler.cron.js.map