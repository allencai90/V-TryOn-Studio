import { GoogleGenAI } from "@google/genai";
import { ImageData, Category } from "../types";

export const performTryOn = async (
  modelImage: ImageData,
  itemImage: ImageData,
  category: Category
): Promise<string> => {
  try {
    // Vite define 会将此替换为字符串。如果未替换，则尝试读取全局 process.env
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
      throw new Error("API Key 未能正确加载到浏览器。请确保：1. Netlify 环境变量中已添加 API_KEY。2. 添加后点击了 'Clear cache and deploy' 重新构建。");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // 针对 gemini-2.5-flash-image 优化的指令
    const prompt = `Virtual Try-On Task:
1. Take the clothing item from the SECOND image.
2. Replace the person's existing clothes in the FIRST image with this item.
3. If it's a ${category} replacement, ensure the original clothes are completely removed and replaced.
4. If the item is a swimsuit or short item, realistically render the person's skin and limbs.
5. Maintain the pose and body shape of the person in the first image.
6. The output must be a single, high-quality photograph of the person wearing the new item.

Category context: ${category}.
Output ONLY the resulting image data.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // 必须使用此模型才能输出图像
      contents: {
        parts: [
          { 
            inlineData: { 
              data: modelImage.base64, 
              mimeType: modelImage.mimeType 
            } 
          },
          { 
            inlineData: { 
              data: itemImage.base64, 
              mimeType: itemImage.mimeType 
            } 
          },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.4,
      }
    });

    // 检查是否有图像输出
    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("AI 拒绝了请求或未能生成内容。");

    const imagePart = candidate.content.parts.find(p => p.inlineData);

    if (imagePart?.inlineData?.data) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    // 如果返回的是文本（比如拒绝信息），抛出文本内容
    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart?.text) {
      throw new Error(`AI 返回了文本而非图片: ${textPart.text.substring(0, 100)}...`);
    }

    throw new Error("未能从 AI 获取图像数据。");

  } catch (error: any) {
    console.error("Try-On Error:", error);
    throw error;
  }
};
