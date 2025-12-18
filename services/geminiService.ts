
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

    const itemLabel = category === 'shoes' ? 'footwear' : 'clothing/outfit';

    /**
     * 【恢复初始核心 Prompt】
     * 关键逻辑：不再死板规定类别，而是让模型通过“Image 1 (Person)”和“Image 2 (Product)”
     * 进行视觉特征迁移。这对泳衣、内衣、紧身衣等需要贴合皮肤的衣物效果最佳。
     */
    const prompt = `Virtual Fashion Try-On Task:
1. Target: The person in image 1.
2. Source: The ${itemLabel} in image 2.
3. Instruction: Change the person's current ${itemLabel} in image 1 to the new one from image 2.
4. Constraints:
   - Precisely follow the person's body contours, pose, and muscle structure.
   - Strictly preserve the person's identity, face, skin tone, and entire background.
   - Ensure hyper-realistic fabric folds and natural shadow interaction.
5. Final Result: Output ONLY the resulting high-quality photograph.`;

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

    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart?.text) {
      throw new Error(`AI 返回: ${textPart.text}`);
    }

    throw new Error("生成失败，请尝试更换清晰的素材图片。");

  } catch (error: any) {
    console.error("Try-On Error:", error);
    const msg = error.message || "";
    if (msg.includes('429')) throw new Error("⚠️ 额度限制：请等待一分钟后再次尝试。");
    if (msg.includes('403')) throw new Error("⚠️ 权限限制：当前 Key 不支持该模型。");
    throw error;
  }
};
