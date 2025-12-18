
import { GoogleGenAI } from "@google/genai";
import { ImageData, Category } from "../types";

export const performTryOn = async (
  modelImage: ImageData,
  itemImage: ImageData,
  category: Category
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key 未配置。");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    // 回退到 Flash 模型，不需要特殊的付费 Key 权限
    const modelName = 'gemini-2.5-flash-image';

    const prompt = `Virtual Try-On Task: 
1. Look at Image 1 (the person) and Image 2 (the garment/item).
2. Take the exact garment/shoes from Image 2 and put it onto the person in Image 1.
3. Ensure the item fits the person's body shape and pose naturally.
4. Keep the person's face, skin tone, and background unchanged.
5. Return only the final merged image showing the person wearing the new item.`;

    const result = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { data: modelImage.base64, mimeType: modelImage.mimeType } },
          { inlineData: { data: itemImage.base64, mimeType: itemImage.mimeType } },
          { text: prompt }
        ]
      }
    });

    const candidate = result.candidates?.[0];
    if (!candidate) throw new Error("AI 响应异常。");

    const imagePart = candidate.content.parts.find(p => p.inlineData);
    if (imagePart?.inlineData?.data) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    throw new Error("未能生成有效图像，请尝试更换图片素材。");

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
