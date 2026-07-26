import { Request, Response } from 'express';
import { crawlerService } from './crawler.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

/**
 * HTTP adapter that validates request context and delegates business work.
 * Feature boundary: Crawler.
 */
export class CrawlerController {
  startManualCrawl = asyncHandler(async (req: Request, res: Response) => {
    // Gọi crawler chạy nền (không await để không block request)
    crawlerService.startCrawl().catch(console.error);
    
    sendSuccess(res, null, 'Crawler has been started in the background', 202);
  });

  stopManualCrawl = asyncHandler(async (req: Request, res: Response) => {
    await crawlerService.stopCrawl();
    sendSuccess(res, null, 'Crawler has been stopped', 200);
  });

  getCrawlerStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = crawlerService.getStatus();
    sendSuccess(res, status, 'Crawler status retrieved successfully', 200);
  });
}

export const crawlerController = new CrawlerController();
/**
 * Translates validated HTTP requests into service calls and standardized API responses.
 * Feature boundary: crawler.
 */
