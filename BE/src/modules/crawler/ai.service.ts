import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.config';

let ai: GoogleGenAI | null = null;
if (env.geminiApiKey) {
  ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
}

export interface ParsedProduct {
  name: string;
  sku: string;
  brand?: string;
  price: number;
  unit: string;
  description: string;
  categoryName?: string;
}

export class AiService {
  async parseProductData(rawText: string, retryCount = 0): Promise<ParsedProduct | null> {
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
  "sku": "Mã SKU hoặc mã sản phẩm trích xuất từ dữ liệu Winmart (ví dụ: 10141374) (chuỗi, bắt buộc)",
  "brand": "Thương hiệu sản phẩm (chuỗi, có thể bỏ trống nếu không tìm thấy)",
  "price": "Giá bán khuyến mãi hoặc giá bán hiện tại cào từ Winmart (số nguyên, không chứa ký tự)",
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

      const parsed: ParsedProduct = JSON.parse(text);
      if (!parsed.name || !parsed.sku || parsed.price === undefined || parsed.price === null) {
         throw new Error("Missing required fields in AI response. Parsed: " + JSON.stringify(parsed));
      }
      return parsed;
    } catch (error: any) {
      console.error(`AI Parsing Error (Retry ${retryCount}):`, error?.message || error);
      
      // Nếu là lỗi 429 (Rate Limit) và chưa quá số lần thử
      if (error?.status === 429 && retryCount < 2) {
        console.log('Hit rate limit (429). Waiting 30s before retrying...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        return this.parseProductData(rawText, retryCount + 1);
      }
      throw new Error('Failed to parse product data using AI');
    }
  }

  async analyze(prompt: string, apiKey?: string): Promise<string> {
    const aiInstance = apiKey ? new GoogleGenAI({ apiKey }) : ai;
    if (!aiInstance) {
      throw new Error('Gemini API key is missing. Cannot perform analysis.');
    }

    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2, // Chút sáng tạo để ra reason
        responseMimeType: 'application/json',
      },
    });

    return response.text || '';
  }
}

export const aiService = new AiService();
