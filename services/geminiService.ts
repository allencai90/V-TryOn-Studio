
import { GoogleGenAI } from "@google/genai";
import { ImageData, Category } from "../types";

export const performTryOn = async (
  modelImage: ImageData,
  itemImage: ImageData,
  category: Category
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "undefined") {
      throw new Error("API Key 未配置。请检查环境设置。");
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = 'gemini-2.5-flash-image';

    const itemLabel = category === 'shoes' ? 'footwear' : 'clothing/outfit/swimsuit';

    /**
     * 核心 Prompt 优化：
     * 针对用户反馈的“效果变差”（尤其是泳衣），回归最简洁但具有约束力的视觉迁移指令。
     * 强调“皮肤保留”和“身体轮廓贴合”。
     */
    const prompt = `Advanced Photorealistic Virtual Try-On Task:
1. Target Model: Image 1 (The person).
2. Target Item: Image 2 (The ${itemLabel} to be worn).
3. Action: Replace the clothing currently worn by the person in Image 1 with the exact garment shown in Image 2.
4. Precision Guidelines:
   - Body Fit: The new garment must naturally wrap around the person's unique body shape, muscles, and pose.
   - Texture & Pattern: Perfectly transfer the fabric texture, pattern, and color from Image 2 to the person.
   - Preservation: Do NOT change the person's face, hair, eyes, background, or original skin tone.
   - Natural Integration: Adjust shadows and highlights on the fabric to match the environment of Image 1.
5. Constraint: Return ONLY the resulting photorealistic image without any extra text or composite frames.`;

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
    if (!candidate) throw new Error("AI 未能返回结果。");

    const imagePart = candidate.content.parts.find(p => p.inlineData);
    if (imagePart?.inlineData?.data) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart?.text) {
      throw new Error(`AI 返回信息: ${textPart.text}`);
    }

    throw new Error("无法合成图像，请尝试使用背景更简洁、模特姿势更标准的照片。");

  } catch (error: any) {
    console.error("Try-On Service Error:", error);
    const msg = error.message || "";
    if (msg.includes('429')) throw new Error("⚠️ 处理量过载，请等待一分钟后再次尝试。");
    if (msg.includes('403')) throw new Error("⚠️ 权限错误或 API Key 已失效。");
    throw error;
  }
};
