"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingService = exports.PricingService = void 0;
const errorHandler_middleware_1 = require("../../middlewares/errorHandler.middleware");
const category_model_1 = require("../../models/category.model");
const inventory_model_1 = require("../../models/inventory.model");
const ai_service_1 = require("../crawler/ai.service");
const competitor_product_model_1 = require("../../models/competitor-product.model");
const mongoose_1 = __importDefault(require("mongoose"));
class PricingService {
    async suggestPrice(data) {
        const { costPrice, categoryId, competitorPrice, name, sku } = data;
        if (!costPrice || costPrice <= 0) {
            throw new errorHandler_middleware_1.AppError('Giá vốn (costPrice) phải lớn hơn 0', 400);
        }
        if (!categoryId) {
            throw new errorHandler_middleware_1.AppError('Thiếu categoryId để tính toán giá sàn', 400);
        }
        // 1. Fetch Category to get minMargin
        const category = await category_model_1.Category.findById(categoryId).exec();
        if (!category) {
            throw new errorHandler_middleware_1.AppError('Không tìm thấy danh mục', 404);
        }
        const minMargin = category.minMargin || 0;
        // 2. Calculate Floor Price
        const floorPrice = Math.round(costPrice * (1 + minMargin / 100));
        // 3. Fetch Inventory Stock & Sales Velocity
        let totalStock = 0;
        if (sku) {
            // Find productId by sku if exists
            const fromDb = await mongoose_1.default.model('Product').findOne({ sku }).exec();
            if (fromDb) {
                const inventories = await inventory_model_1.Inventory.find({ productId: fromDb._id }).exec();
                totalStock = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
            }
        }
        // 4. Competitor Price
        let compPrice = competitorPrice;
        if (!compPrice && name) {
            const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cp = await competitor_product_model_1.CompetitorProduct.findOne({ normalizedName }).sort({ createdAt: -1 }).exec();
            if (cp && cp.price) {
                compPrice = cp.price;
            }
        }
        // 5. Construct Prompt for Gemini AI
        const prompt = `
Bạn là một AI Định giá (Pricing Engine) thông minh cho hệ thống siêu thị mini.
Nhiệm vụ: Đề xuất giá bán (salePrice) phù hợp dựa trên các dữ liệu sau:
- Tên sản phẩm: ${name || 'Chưa rõ'}
- Giá nhập (Cost Price): ${costPrice} VNĐ
- Biên lợi nhuận tối thiểu quy định: ${minMargin}%
- Giá Sàn (Floor Price bắt buộc phải tuân thủ, không được bán dưới giá này): ${floorPrice} VNĐ
- Giá tham chiếu của đối thủ (Winmart/Coopmart): ${compPrice ? compPrice + ' VNĐ' : 'Chưa có thông tin'}
- Tồn kho hiện tại: ${totalStock} sản phẩm

Hãy phân tích và đưa ra 1 mức giá bán (Suggested Price) tối ưu nhất để cạnh tranh và tối đa hóa lợi nhuận.
Tuyệt đối KHÔNG đưa ra giá thấp hơn Floor Price.
Trả về dữ liệu dưới định dạng JSON hợp lệ, có đúng 3 trường:
{
  "suggestedPrice": <number, làm tròn đến hàng trăm/nghìn VNĐ>,
  "confidence": <number từ 0 đến 100, thể hiện mức độ tự tin vào giá đề xuất>,
  "reason": "<string, diễn giải ngắn gọn bằng tiếng Việt lý do chọn mức giá này, gạch đầu dòng>"
}
Chú ý: Chỉ trả về JSON, không kèm markdown.
`;
        // 6. Call Gemini
        const apiKey = process.env.GEMINI_API_KEY_PRICING || process.env.GEMINI_API_KEY;
        const aiResponseStr = await ai_service_1.aiService.analyze(prompt, apiKey);
        let result;
        try {
            const cleanJson = aiResponseStr.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanJson);
        }
        catch (err) {
            console.error('Failed to parse AI response:', aiResponseStr);
            throw new errorHandler_middleware_1.AppError('AI định giá đang gặp sự cố trả về sai định dạng. Thử lại sau.', 500);
        }
        // Validation post-AI
        if (result.suggestedPrice < floorPrice) {
            result.suggestedPrice = floorPrice;
            result.reason += ' (Hệ thống đã tự động đẩy giá lên mức Giá Sàn để đảm bảo không vi phạm quy định lợi nhuận).';
        }
        return {
            suggestedPrice: result.suggestedPrice,
            confidence: result.confidence || 0,
            reason: result.reason || '',
            floorPrice
        };
    }
}
exports.PricingService = PricingService;
exports.pricingService = new PricingService();
//# sourceMappingURL=pricing.service.js.map