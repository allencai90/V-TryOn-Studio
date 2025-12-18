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
      throw new Error("API Key 未配置。请在 Netlify Environment Variables 中设置 API_KEY。");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // 根据类别精准定义 AI 的操作目标
    let detailedGoal = "";
    switch(category) {
      case 'clothes': 
        detailedGoal = "REPLACE the existing top/garment with this new piece."; 
        break;
      case 'pants': 
        detailedGoal = "REPLACE the existing pants/bottoms with this new piece."; 
        break;
      case 'shoes': 
        detailedGoal = "REPLACE the current shoes with these new ones."; 
        break;
      case 'full-outfit': 
        detailedGoal = "REPLACE the ENTIRE OUTFIT (top and bottom) with this one-piece/dress."; 
        break;
    }
    
    /**
     * 极度强化的提示词：
     * 针对“裤子还在”的顽疾，加入“裸露皮肤渲染”指令。
     */
    const prompt = `ACT AS A PROFESSIONAL CLOTHING EDITOR.
TASK: Virtual Try-On for a ${category}.

IMAGE 1: The Model.
IMAGE 2: The Target Item (Ignore any backgrounds or hangers in this image).

EXECUTION STEPS:
1. IDENTIFY: Locate the person in Image 1.
2. DELETE: COMPLETELY REMOVE ALL current clothing the person is wearing in Image 1. This includes ANY shirt, jacket, sweater, pants, shorts, or skirts. The person should be treated as a blank canvas for the new item.
3. RENDER SKIN: If the target item in Image 2 is smaller than the original clothes (e.g., Image 2 is a bikini or swimsuit, but Image 1 is wearing a bulky sweater and jeans), you MUST realistically render the person's bare skin (torso, belly, legs, and arms) that would naturally be exposed.
4. APPLY: Place the item from Image 2 onto the person. It must fit their body shape, curves, and pose naturally.
5. QUALITY: Ensure the lighting, shadows, and fabric texture blend perfectly with the environment of Image 1.

CRITICAL RULES:
- THE ORIGINAL PANTS MUST BE GONE.
- THE ORIGINAL TOP MUST BE GONE.
- If it's a swimsuit, show the legs and midriff.
- DO NOT just overlay the image. Perform a full pixel replacement.

Output ONLY the resulting image.`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // 使用最新预览版以获得更好的空间逻辑理解
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
        temperature: 0.1, // 极低温度，强制遵循“删除原有裤子”的指令
        topP: 0.95
      }
    });

    const candidate = result.candidates?.[0];
    if (!candidate) throw new Error("AI 没能理解图片内容，请尝试换一张光线更好的模特图。");

    const imagePart = candidate.content.parts.find(p => p.inlineData);

    if (imagePart?.inlineData?.data) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    const textPart = candidate.content.parts.find(p => p.text);
    throw new Error(textPart?.text || "生成图像失败，请重试。");

  } catch (error: any) {
    console.error("Try-On Error:", error);
    throw error;
  }
};
