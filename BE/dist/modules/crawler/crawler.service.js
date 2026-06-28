"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlerService = exports.CrawlerService = void 0;
const crawlee_1 = require("crawlee");
const crawler_config_1 = require("./crawler.config");
const ai_service_1 = require("./ai.service");
const image_service_1 = require("./image.service");
const product_model_1 = require("../../models/product.model");
const category_model_1 = require("../../models/category.model");
class CrawlerService {
    constructor() {
        this.isRunning = false;
        this.crawlerInstance = null;
    }
    getStatus() {
        return { isRunning: this.isRunning };
    }
    async stopCrawl() {
        if (this.crawlerInstance && this.isRunning) {
            console.log('--- Stopping Web Crawler ---');
            await this.crawlerInstance.teardown();
            this.isRunning = false;
            this.crawlerInstance = null;
            console.log('--- Web Crawler Stopped ---');
        }
    }
    async startCrawl() {
        if (this.isRunning) {
            console.log('Crawler is already running. Skipping this trigger.');
            return;
        }
        this.isRunning = true;
        console.log('--- Starting Web Crawler ---');
        try {
            this.crawlerInstance = new crawlee_1.PlaywrightCrawler({
                maxRequestsPerCrawl: crawler_config_1.crawlerConfig.maxRequestsPerCrawl,
                maxConcurrency: crawler_config_1.crawlerConfig.maxConcurrency,
                requestHandlerTimeoutSecs: crawler_config_1.crawlerConfig.requestHandlerTimeoutSecs,
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
                        const parsedData = await ai_service_1.aiService.parseProductData(rawText);
                        if (parsedData) {
                            log.info(`AI Parsed: ${parsedData.name}`);
                            // Xử lý Category
                            let categoryId = undefined;
                            if (parsedData.categoryName) {
                                // Tìm danh mục gần giống nhất
                                const category = await category_model_1.Category.findOne({
                                    name: { $regex: new RegExp(parsedData.categoryName, 'i') },
                                });
                                if (category) {
                                    categoryId = category._id;
                                }
                            }
                            let finalImageUrl = undefined;
                            if (mainImageUrl) {
                                const uploaded = await image_service_1.crawlerImageService.uploadFromUrl(mainImageUrl, parsedData.sku);
                                if (uploaded)
                                    finalImageUrl = uploaded;
                            }
                            // Lưu vào Database
                            const existingProduct = await product_model_1.Product.findOne({ sku: parsedData.sku });
                            if (existingProduct) {
                                existingProduct.salePrice = parsedData.salePrice;
                                existingProduct.description = parsedData.description || existingProduct.description;
                                if (categoryId)
                                    existingProduct.categoryId = categoryId;
                                if (finalImageUrl)
                                    existingProduct.imageUrl = finalImageUrl;
                                await existingProduct.save();
                                log.info(`Updated product: ${parsedData.sku}`);
                            }
                            else {
                                await product_model_1.Product.create({
                                    name: parsedData.name,
                                    sku: parsedData.sku,
                                    salePrice: parsedData.salePrice,
                                    unit: parsedData.unit,
                                    description: parsedData.description,
                                    categoryId: categoryId,
                                    imageUrl: finalImageUrl,
                                    status: 'active',
                                });
                                log.info(`Created new product: ${parsedData.sku}`);
                            }
                            // Lưu log vào file cục bộ (Dataset của Crawlee) để tiện kiểm tra
                            await crawlee_1.Dataset.pushData({
                                url: request.url,
                                rawParsed: parsedData,
                                dbStatus: existingProduct ? 'updated' : 'created',
                            });
                        }
                        else {
                            log.warning(`AI failed to parse product at ${request.url}`);
                        }
                    }
                },
                failedRequestHandler({ request, log }) {
                    log.error(`Request ${request.url} failed too many times.`);
                },
            });
            // Bắt đầu cào
            await this.crawlerInstance.run(crawler_config_1.crawlerConfig.startUrls);
            console.log('--- Web Crawler Finished ---');
        }
        catch (error) {
            console.error('Crawler Error:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
}
exports.CrawlerService = CrawlerService;
exports.crawlerService = new CrawlerService();
//# sourceMappingURL=crawler.service.js.map