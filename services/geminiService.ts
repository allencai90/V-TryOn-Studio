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
      throw new Error("API Key 未配置。请确保环境变量 API_KEY 已设置。");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // 更加激进的类别描述
    let targetDescription = "";
    switch(category) {
      case 'clothes': 
        targetDescription = "this one-piece garment/swimsuit/top"; 
        break;
      case 'shoes': 
        targetDescription = "this footwear"; 
        break;
      case 'pants': 
        targetDescription = "these trousers/pants"; 
        break;
      case 'full-outfit': 
        targetDescription = "this complete outfit"; 
        break;
      default: 
        targetDescription = "this specific item";
    }
    
    /**
     * 核心逻辑更新：
     * 1. 使用 "ERASE EVERYTHING" 指令
     * 2. 明确指出如果目标是泳衣，必须移除原有的裤子/长袖
     * 3. 要求重新渲染皮肤 (Render realistic skin)
     */
    const prompt = `CRITICAL TASK: HIGH-FIDELITY VIRTUAL TRY-ON
1. OBJECTIVE: Take the ${targetDescription} from Image 2 and put it on the person in Image 1.
2. STEP 1 (ERASE): COMPLETELY ERASE and REMOVE every piece of existing clothing the person is wearing in Image 1. This includes shirts, jackets, pants, and skirts. The original clothes MUST NOT be visible.
3. STEP 2 (REPLACE): Put the ${targetDescription} from Image 2 onto the person.
4. STEP 3 (ANATOMY): If the new item (like a swimsuit) covers less area than the original clothes (like pants or sweaters), you MUST realistically render the person's bare skin, legs, and torso to match the new garment's shape.
5. STEP 4 (BLENDING): Ensure the lighting on the new garment matches the background of Image 1 perfectly.
6. STEP 5 (POSE): The garment must fold and stretch according to the person's pose in Image 1.
7. FINAL CHECK: The person should ONLY be wearing the ${targetDescription} from Image 2. No original sleeves, collars, or pant legs should remain.

Output ONLY the final processed image. No text.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
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
        // 降低温度以获得更写实、更符合指令的结果
        temperature: 0.2,
      }
    });

    const candidate = result.candidates?.[0];
    if (!candidate) throw new Error("AI 未返回任何结果。");

    const imagePart = candidate.content.parts.find(p => p.inlineData);

    if (imagePart?.inlineData?.data) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    const textPart = candidate.content.parts.find(p => p.text);
    throw new Error(textPart?.text || "生成失败。请确保图片清晰且人物姿态完整。");

  } catch (error: any) {
    console.error("Gemini Try-On Error:", error);
    throw error;
  }
};
