import { AppError } from '../../middlewares/errorHandler.middleware';
import { Category } from '../../models/category.model';
import { Inventory } from '../../models/inventory.model';
import { aiService } from '../crawler/ai.service';
import { CompetitorProduct } from '../../models/competitor-product.model';
import mongoose from 'mongoose';
import { normalizeString } from '../../utils/string.util';

export class PricingService {
  async suggestPrice(data: {
    costPrice: number;
    categoryId: string;
    competitorPrice?: number;
    name?: string;
    sku?: string;
  }): Promise<{ suggestedPrice: number; confidence: number; reason: string; floorPrice: number }> {
    const { costPrice, categoryId, competitorPrice, name, sku } = data;

    if (!costPrice || costPrice <= 0) {
      throw new AppError('Giá vốn (costPrice) phải lớn hơn 0', 400);
    }
    if (!categoryId) {
      throw new AppError('Thiếu categoryId để tính toán giá sàn', 400);
    }

    // 1. Fetch Category to get minMargin
    const category = await Category.findById(categoryId).exec();
    if (!category) {
      throw new AppError('Không tìm thấy danh mục', 404);
    }
    const minMargin = category.minMargin || 0;

    // 2. Calculate Floor Price
    const floorPrice = Math.round(costPrice * (1 + minMargin / 100));

    // 3. Fetch Inventory Stock & Sales Velocity
    let totalStock = 0;
    if (sku) {
      // Find productId by sku if exists
      const fromDb = await mongoose.model('Product').findOne({ sku }).exec();
      if (fromDb) {
        const inventories = await Inventory.find({ productId: fromDb._id }).exec();
        totalStock = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
      }
    }

    // 4. Competitor Price
    let compPrice = competitorPrice;
    if (!compPrice && name) {
      const normalizedName = normalizeString(name);
      const cp = await CompetitorProduct.findOne({ normalizedName }).sort({ createdAt: -1 }).exec();
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
    const aiResponseStr = await aiService.analyze(prompt, apiKey);
    let result;
    try {
      const cleanJson = aiResponseStr.replace(/```json/g, '').replace(/```/g, '').trim();
      result = JSON.parse(cleanJson);
    } catch (err) {
      console.error('Failed to parse AI response:', aiResponseStr);
      throw new AppError('AI định giá đang gặp sự cố trả về sai định dạng. Thử lại sau.', 500);
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

  async suggestPriceBulk(items: Array<{
    costPrice: number;
    categoryId: string;
    competitorPrice?: number;
    name?: string;
    sku?: string;
  }>): Promise<Array<{ suggestedPrice: number; confidence: number; reason: string; floorPrice: number }>> {
    if (!items || items.length === 0) {
      return [];
    }

    const processedItems = [];
    
    for (const item of items) {
      const { costPrice, categoryId, competitorPrice, name, sku } = item;
      
      if (!costPrice || costPrice <= 0) {
        throw new AppError('Giá vốn (costPrice) phải lớn hơn 0', 400);
      }
      if (!categoryId) {
        throw new AppError('Thiếu categoryId để tính toán giá sàn', 400);
      }

      // Fetch category
      const category = await Category.findById(categoryId).exec();
      if (!category) {
        throw new AppError('Không tìm thấy danh mục cho sản phẩm: ' + (name || sku || ''), 404);
      }
      const minMargin = category.minMargin || 0;
      const floorPrice = Math.round(costPrice * (1 + minMargin / 100));

      // Fetch stock
      let totalStock = 0;
      if (sku) {
        const fromDb = await mongoose.model('Product').findOne({ sku }).exec();
        if (fromDb) {
          const inventories = await Inventory.find({ productId: fromDb._id }).exec();
          totalStock = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
        }
      }

      // Fetch competitor price
      let compPrice = competitorPrice;
      if (!compPrice && name) {
        const normalizedName = normalizeString(name);
        const cp = await CompetitorProduct.findOne({ normalizedName }).sort({ createdAt: -1 }).exec();
        if (cp && cp.price) {
          compPrice = cp.price;
        }
      }

      processedItems.push({
        name: name || 'Chưa rõ',
        sku: sku || 'Chưa rõ',
        costPrice,
        minMargin,
        floorPrice,
        competitorPrice: compPrice || 0,
        totalStock
      });
    }

    // Build the prompt for bulk pricing
    const productsDetails = processedItems.map((item, idx) => `
Sản phẩm thứ ${idx + 1}:
- Tên sản phẩm: ${item.name}
- Giá nhập: ${item.costPrice} VNĐ
- Biên lợi nhuận tối thiểu: ${item.minMargin}%
- Giá Sàn: ${item.floorPrice} VNĐ
- Giá đối thủ tham chiếu: ${item.competitorPrice > 0 ? item.competitorPrice + ' VNĐ' : 'Chưa có thông tin'}
- Tồn kho hiện tại: ${item.totalStock} sản phẩm
`).join('\n');

    const prompt = `
Bạn là một AI Định giá (Pricing Engine) thông minh cho hệ thống siêu thị mini.
Nhiệm vụ: Đề xuất giá bán (salePrice) phù hợp cho từng sản phẩm trong danh sách dưới đây:

${productsDetails}

Hãy phân tích và đưa ra giá bán tối ưu cho từng sản phẩm tương ứng theo thứ tự của danh sách trên.
Tuyệt đối KHÔNG đưa ra giá thấp hơn Floor Price của mỗi sản phẩm.
Trả về dữ liệu dưới định dạng JSON array hợp lệ, có đúng số lượng phần tử bằng số lượng sản phẩm đầu vào, mỗi phần tử có đúng 3 trường:
[
  {
    "suggestedPrice": <number, làm tròn đến hàng trăm/nghìn VNĐ>,
    "confidence": <number từ 0 đến 100, thể hiện mức độ tự tin>,
    "reason": "<string, diễn giải ngắn gọn bằng tiếng Việt lý do chọn mức giá này>"
  },
  ...
]
Chú ý: Chỉ trả về JSON array, không kèm markdown.
`;

    const apiKey = process.env.GEMINI_API_KEY_PRICING || process.env.GEMINI_API_KEY;
    const aiResponseStr = await aiService.analyze(prompt, apiKey);
    let resultsList;
    try {
      const cleanJson = aiResponseStr.replace(/```json/g, '').replace(/```/g, '').trim();
      resultsList = JSON.parse(cleanJson);
    } catch (err) {
      console.error('Failed to parse AI bulk response:', aiResponseStr);
      throw new AppError('AI định giá đang gặp sự cố trả về sai định dạng. Thử lại sau.', 500);
    }

    if (!Array.isArray(resultsList)) {
      throw new AppError('AI định giá trả về sai định dạng danh sách.', 500);
    }

    const finalResults = [];
    for (let i = 0; i < processedItems.length; i++) {
      const item = processedItems[i];
      const resultItem = resultsList[i] || { suggestedPrice: item.floorPrice, confidence: 50, reason: 'Gợi ý mặc định theo giá sàn.' };
      
      let sugPrice = resultItem.suggestedPrice;
      let sugReason = resultItem.reason || '';

      if (sugPrice < item.floorPrice) {
        sugPrice = item.floorPrice;
        sugReason += ' (Hệ thống đã tự động đẩy giá lên mức Giá Sàn để đảm bảo không vi phạm quy định lợi nhuận).';
      }

      finalResults.push({
        suggestedPrice: sugPrice,
        confidence: resultItem.confidence || 0,
        reason: sugReason,
        floorPrice: item.floorPrice
      });
    }

    return finalResults;
  }
}

export const pricingService = new PricingService();
