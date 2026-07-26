import { PlaywrightCrawler, Dataset } from 'crawlee';
import { crawlerConfig } from './crawler.config';
import { aiService } from './ai.service';
import { crawlerImageService } from './image.service';
import { CompetitorProduct } from '../../models/competitor-product.model';
import { Category } from '../../models/category.model';
import { normalizeString } from '../../utils/string.util';
import { emitToRoom, emitGlobal } from '../../config/socket.config';

/**
 * Application service that coordinates business rules, authorization, and side effects.
 * Feature boundary: Crawler.
 */
export class CrawlerService {
  private isRunning = false;
  private crawlerInstance: PlaywrightCrawler | null = null;
  private crawledCount = 0;

  public getStatus() {
    return { isRunning: this.isRunning, crawledCount: this.crawledCount };
  }

  public async stopCrawl(): Promise<void> {
    if (this.crawlerInstance && this.isRunning) {
      console.log('--- Stopping Web Crawler ---');
      await this.crawlerInstance.teardown();
      this.isRunning = false;
      this.crawlerInstance = null;
      console.log('--- Web Crawler Stopped ---');
      emitGlobal('crawler:status', { isRunning: false, crawledCount: this.crawledCount });
    }
  }

  public async startCrawl(): Promise<void> {
    if (this.isRunning) {
      console.log('Crawler is already running. Skipping this trigger.');
      return;
    }
    const self = this;
    this.isRunning = true;
    this.crawledCount = 0;
    console.log('--- Starting Web Crawler ---');
    emitGlobal('crawler:status', { isRunning: true, crawledCount: 0 });

    try {
      this.crawlerInstance = new PlaywrightCrawler({
        maxRequestsPerCrawl: crawlerConfig.maxRequestsPerCrawl,
        maxConcurrency: crawlerConfig.maxConcurrency,
        requestHandlerTimeoutSecs: crawlerConfig.requestHandlerTimeoutSecs,

        // Cấu hình trình duyệt
        browserPoolOptions: {
          useFingerprints: true, // Chống nhận diện bot
        },
        // Thêm cấu hình tự khởi động lại trình duyệt để giải phóng RAM
        sessionPoolOptions: {
          maxPoolSize: 1,
        },

        async requestHandler({ page, request, enqueueLinks, log }) {
          log.info(`Processing ${request.url}...`);

          // Kiểm tra xem URL có phải là trang sản phẩm không (thường chứa --s theo sau là mã số)
          const isProductPage = request.url.includes('--s') && /\-\-s\d+/.test(request.url);

          // Nếu không phải trang sản phẩm, tìm và thêm các link vào Queue
          if (!isProductPage) { 
             await enqueueLinks({
              globs: ['https://winmart.vn/**'],
              label: 'DETAIL_OR_CATEGORY',
            });
            
            // Lấy thêm các thẻ a nếu cần
            const links = await page.$$eval('a', (els) => els.map((e) => e.href));
            const filteredLinks = links.filter((link) => link.includes('winmart.vn/') && (link.includes('--c') || link.includes('--s')));
            await enqueueLinks({ urls: filteredLinks });
          }

          if (isProductPage) {
            log.info(`Found product page: ${request.url}`);
            
            // Chờ cho nội dung load xong (có thể thay đổi tuỳ selector thực tế của winmart)
            await page.waitForTimeout(2000); 

            // Cào toàn bộ text trên trang
            const rawText = await page.locator('body').innerText();
            
            // Cào hình ảnh chính (tìm ảnh to nhất hoặc có class đặc thù, tạm lấy img đầu tiên trong khung chính)
            const imageUrls = await page.$$eval('img', (imgs) => imgs.map((img) => img.src).filter((src) => src.includes('http') && !src.includes('logo')));
            const mainImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';

            log.info(`Extracted raw text, sending to AI...`);

            // Gửi qua AI xử lý
            // Thêm độ trễ 12s để tránh vượt quá giới hạn 15 requests/phút của API Gemini (Free Tier)
            await new Promise(resolve => setTimeout(resolve, 12000));

            const parsedData = await aiService.parseProductData(rawText);

            if (parsedData) {
              log.info(`AI Parsed: ${parsedData.name} (SKU: ${parsedData.sku})`);

              let finalImageUrl: string | undefined = undefined;
              
              const normalizedName = normalizeString(parsedData.name);
              const normalizedBrand = parsedData.brand ? normalizeString(parsedData.brand) : undefined;
              const normalizedUnit = normalizeString(parsedData.unit || 'item');

              // Check duplication by competitor SKU
              const existingProduct = await CompetitorProduct.findOne({ 
                sku: parsedData.sku
              });

              if (mainImageUrl) {
                const uploaded = await crawlerImageService.uploadFromUrl(mainImageUrl, parsedData.sku);
                if (uploaded) finalImageUrl = uploaded;
              }

              // Lưu vào Database
              if (existingProduct) {
                existingProduct.price = parsedData.price;
                existingProduct.description = parsedData.description || existingProduct.description;
                if (parsedData.brand) existingProduct.brand = parsedData.brand;
                if (finalImageUrl) existingProduct.imageUrl = finalImageUrl;
                existingProduct.sourceUrl = request.url;
                
                existingProduct.normalizedName = normalizedName;
                existingProduct.normalizedBrand = normalizedBrand;
                existingProduct.normalizedUnit = normalizedUnit;

                await existingProduct.save();
                log.info(`Updated competitor product: ${existingProduct.name}`);
              } else {
                await CompetitorProduct.create({
                  name: parsedData.name,
                  brand: parsedData.brand,
                  sku: parsedData.sku,
                  price: parsedData.price,
                  unit: parsedData.unit,
                  description: parsedData.description,
                  imageUrl: finalImageUrl,
                  source: 'Winmart',
                  sourceUrl: request.url,
                  normalizedName,
                  normalizedBrand,
                  normalizedUnit,
                });
                log.info(`Created new competitor product: ${parsedData.name}`);
              }

              // Lưu log vào file cục bộ (Dataset của Crawlee) để tiện kiểm tra
              await Dataset.pushData({
                url: request.url,
                rawParsed: parsedData,
                dbStatus: existingProduct ? 'updated' : 'created',
              });

              // Cập nhật tiến độ cào realtime
              self.crawledCount++;
              emitGlobal('crawler:progress', {
                isRunning: self.isRunning,
                crawledCount: self.crawledCount,
                lastCrawledProduct: parsedData.name,
              });
            } else {
              log.warning(`AI failed to parse product at ${request.url}`);
            }
          }
        },

        failedRequestHandler({ request, log }) {
          log.error(`Request ${request.url} failed too many times.`);
        },
      });

      // Bắt đầu cào
      await this.crawlerInstance.run(crawlerConfig.startUrls);
      console.log('--- Web Crawler Finished ---');
      emitGlobal('crawler:status', { isRunning: false, crawledCount: this.crawledCount });
    } catch (error) {
      console.error('Crawler Error:', error);
      emitGlobal('crawler:status', { isRunning: false, crawledCount: this.crawledCount, error: String(error) });
    } finally {
      this.isRunning = false;
    }
  }
}

export const crawlerService = new CrawlerService();
