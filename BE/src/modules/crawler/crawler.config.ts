export const crawlerConfig = {
  // URLs gốc để bắt đầu cào
  startUrls: [
    'https://winmart.vn/', 
  ],
  
  // Cấu hình giới hạn
  maxRequestsPerCrawl: 1000, // Cào tối đa 1000 sản phẩm mỗi lần để tránh bị block hoặc quá tải
  maxConcurrency: 1,         // Số lượng tab mở đồng thời (Set = 1 để tránh Gemini Rate Limit)
  requestHandlerTimeoutSecs: 60, 
};
/**
 * Supports backend composition, shared contracts, scheduled work, or operational data maintenance.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
