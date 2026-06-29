"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AiService = void 0;
const genai_1 = require("@google/genai");
const env_config_1 = require("../../config/env.config");
let ai = null;
if (env_config_1.env.geminiApiKey) {
    ai = new genai_1.GoogleGenAI({ apiKey: env_config_1.env.geminiApiKey });
}
class AiService {
    async parseProductData(rawText) {
        if (!ai) {
            console.warn('Gemini API key is missing. Skipping AI parsing.');
            return null;
        }
        const prompt = `
Bạn là một chuyên gia trích xuất dữ liệu sản phẩm bán lẻ.
Dưới đây là một đoạn văn bản thô được cào từ một trang web siêu thị (Winmart).
Hãy trích xuất thông tin sản phẩm và định dạng lại dưới dạng JSON theo đúng schema sau:
{
  "name": "Tên sản phẩm (chuỗi)",
  "sku": "Mã SKU (chuỗi viết hoa không dấu, độ dài 5-15 ký tự, tự tạo dựa trên tên nếu không có sẵn)",
  "salePrice": "Giá bán khuyến mãi hoặc giá bán hiện tại (số nguyên, không chứa ký tự)",
  "unit": "Đơn vị tính, ví dụ: kg, g, lốc, hộp, gói, cái (chuỗi)",
  "description": "Đoạn mô tả ngắn gọn về sản phẩm (chuỗi)",
  "categoryName": "Tên danh mục phù hợp nhất với sản phẩm này (chuỗi)"
}

TUYỆT ĐỐI CHỈ TRẢ VỀ CHUỖI JSON, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI (KHÔNG BAO GỒM markdown \`\`\`json).

Dữ liệu thô:
"""
${rawText.substring(0, 20000)}
"""
`;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    temperature: 0, // Độ chính xác cao
                    responseMimeType: 'application/json',
                },
            });
            let text = response.text || '';
            // Loại bỏ markdown code block nếu AI lỡ thêm vào (mặc dù đã có responseMimeType)
            text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(text);
            if (!parsed.name || parsed.salePrice === undefined || parsed.salePrice === null) {
                throw new Error("Missing required fields in AI response. Parsed: " + JSON.stringify(parsed));
            }
            return parsed;
        }
        catch (error) {
            console.error('AI Parsing Error:', error);
            // Bạn có thể comment dòng dưới lại nếu log quá dài
            // console.log('Raw text that failed:', rawText);
            return null;
        }
    }
}
exports.AiService = AiService;
exports.aiService = new AiService();
//# sourceMappingURL=ai.service.js.map