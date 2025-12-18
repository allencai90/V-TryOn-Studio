
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
      throw new Error("API Key 未配置。请检查 Netlify 环境变量中是否已添加 API_KEY，并确保已重新部署。");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // 强化针对“裤子残留”的类别指令
    const isFullBodyReplacement = category === 'full-outfit' || category === 'clothes';
    
    const prompt = `CRITICAL PHOTOREALISTIC EDITING TASK:
Goal: Move the item from Image 2 onto the person in Image 1.

STRICT EXECUTION RULES:
1. MANDATORY REMOVAL: You MUST COMPLETELY REMOVE and ERASE all existing clothes on the person in Image 1. This includes their shirt, jacket, trousers, jeans, and skirts.
2. NO GHOSTING: The original pants MUST NOT be visible under the new outfit.
3. SKIN RECONSTRUCTION: If the new item (like a swimsuit) is smaller than the original clothes (like long pants), you MUST realistically render the person's bare legs, waist, and skin. Do not leave any fabric from the original pants.
4. ALIGNMENT: The new garment must wrap around the person's body following their specific pose and perspective.
5. QUALITY: The final output must look like a high-end fashion catalog photo.

SPECIFIC INSTRUCTION FOR THIS REQUEST:
${category === 'full-outfit' ? "This is a full-body outfit. The person should NOT be wearing anything from their original photo." : ""}
${category === 'clothes' ? "The target is the upper body/torso. If the item is long (like a dress), remove the original pants as well." : ""}

Output ONLY the final 100% processed image. No text.`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
        temperature: 0.1, // 降低温度，减少 AI “偷懒”保留原图像素的可能性
        topP: 0.95
      }
    });

    const candidate = result.candidates?.[0];
    if (!candidate) throw new Error("AI 未能生成结果，请更换图片尝试。");

    const imagePart = candidate.content.parts.find(p => p.inlineData);

    if (imagePart?.inlineData?.data) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    const textPart = candidate.content.parts.find(p => p.text);
    throw new Error(textPart?.text || "生成图像失败。");

  } catch (error: any) {
    console.error("Try-On Error:", error);
    throw error;
  }
};
