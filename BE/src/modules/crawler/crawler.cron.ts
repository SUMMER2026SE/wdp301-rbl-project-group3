import cron from 'node-cron';
import { crawlerService } from './crawler.service';

// Chạy vào lúc 2:00 sáng mỗi ngày
export const initCrawlerCron = () => {
  cron.schedule('0 2 * * *', () => {
    console.log('--- Triggering daily Winmart Crawler via Cron Job ---');
    crawlerService.startCrawl().catch(console.error);
  });
  console.log('Crawler Cron Job initialized (Scheduled for 02:00 AM daily).');
};
