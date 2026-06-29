import { PlaywrightCrawler, Dataset } from 'crawlee';
import { crawlerConfig } from './crawler.config';
import { aiService } from './ai.service';
import { crawlerImageService } from './image.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';

export class CrawlerService {
  private isRunning = false;
  private crawlerInstance: PlaywrightCrawler | null = null;

  public getStatus() {
    return { isRunning: this.isRunning };
  }

  public async stopCrawl(): Promise<void> {
    if (this.crawlerInstance && this.isRunning) {
      console.log('--- Stopping Web Crawler ---');
      await this.crawlerInstance.teardown();
      this.isRunning = false;
      this.crawlerInstance = null;
      console.log('--- Web Crawler Stopped ---');
    }
  }

  public async startCrawl(): Promise<void> {
    if (this.isRunning) {
      console.log('Crawler is already running. Skipping this trigger.');
      return;
    }
    this.isRunning = true;
    console.log('--- Starting Web Crawler ---');

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
            // Lưu ý: Có thể cần điều chỉnh selector hình ảnh tuỳ thuộc DOM Winmart
            const imageUrls = await page.$$eval('img', (imgs) => imgs.map((img) => img.src).filter((src) => src.includes('http') && !src.includes('logo')));
            const mainImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';

            log.info(`Extracted raw text, sending to AI...`);

            // Gửi qua AI xử lý
            // Thêm độ trễ 4.5s để tránh vượt quá 15 requests/phút của API Gemini (Free Tier)
            await new Promise(resolve => setTimeout(resolve, 4500));

            const parsedData = await aiService.parseProductData(rawText);

            if (parsedData) {
              log.info(`AI Parsed: ${parsedData.name}`);

              // Xử lý Category
              let categoryId = undefined;
              if (parsedData.categoryName) {
                // Tìm danh mục gần giống nhất
                const category = await Category.findOne({
                  name: { $regex: new RegExp(parsedData.categoryName, 'i') },
                });
                if (category) {
                  categoryId = category._id;
                }
              }

              let finalImageUrl: string | undefined = undefined;
              const generatedSku = 'WM' + Date.now().toString() + Math.floor(Math.random() * 1000).toString();
              const existingProduct = await Product.findOne({ name: parsedData.name });
              const productSku = existingProduct ? existingProduct.sku : generatedSku;

              if (mainImageUrl) {
                const uploaded = await crawlerImageService.uploadFromUrl(mainImageUrl, productSku);
                if (uploaded) finalImageUrl = uploaded;
              }

              // Lưu vào Database
              if (existingProduct) {
                existingProduct.suggestedPrice = parsedData.suggestedPrice;
                existingProduct.description = parsedData.description || existingProduct.description;
                if (categoryId) existingProduct.categoryId = categoryId;
                if (finalImageUrl) existingProduct.imageUrl = finalImageUrl;
                await existingProduct.save();
                log.info(`Updated product: ${existingProduct.name}`);
              } else {
                await Product.create({
                  name: parsedData.name,
                  sku: productSku,
                  salePrice: 0,
                  suggestedPrice: parsedData.suggestedPrice,
                  unit: parsedData.unit,
                  description: parsedData.description,
                  categoryId: categoryId,
                  imageUrl: finalImageUrl,
                  status: 'active',
                });
                log.info(`Created new product: ${parsedData.name}`);
              }

              // Lưu log vào file cục bộ (Dataset của Crawlee) để tiện kiểm tra
              await Dataset.pushData({
                url: request.url,
                rawParsed: parsedData,
                dbStatus: existingProduct ? 'updated' : 'created',
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
    } catch (error) {
      console.error('Crawler Error:', error);
    } finally {
      this.isRunning = false;
    }
  }
}

export const crawlerService = new CrawlerService();
