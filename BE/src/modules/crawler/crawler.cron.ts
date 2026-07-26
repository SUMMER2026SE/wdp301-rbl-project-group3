import cron from 'node-cron';
import { crawlerService } from './crawler.service';

// Chạy vào lúc 2:00 sáng mỗi ngày
/**
 * Starts scheduled crawler runs according to configured operational timing.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const initCrawlerCron = () => {
  cron.schedule('0 2 * * *', () => {
    console.log('--- Triggering daily Winmart Crawler via Cron Job ---');
    crawlerService.startCrawl().catch(console.error);
  });
  console.log('Crawler Cron Job initialized (Scheduled for 02:00 AM daily).');
};
/**
 * Supports backend composition, shared contracts, scheduled work, or operational data maintenance.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
