
import { GoogleGenAI } from "@google/genai";
import { ImageData, Category } from "../types";

export const performTryOn = async (
  modelImage: ImageData,
  itemImage: ImageData,
  category: Category
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
      throw new Error("API Key 未配置。请确保已设置环境变量或在右上角手动设置。");
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = 'gemini-2.5-flash-image';

    let categoryContext = "";
    let additionalInstructions = "";

    switch(category) {
      case 'swimwear':
        categoryContext = "swimwear/bikini/one-piece";
        additionalInstructions = "This is a swimwear try-on. Extremely important: Preserve the person's exact skin tone and body shape. The swimwear from image 2 must perfectly fit the person's torso and curves in image 1. Natural edges and realistic skin-to-fabric transitions are mandatory.";
        break;
      case 'shoes':
        categoryContext = "shoes/footwear";
        additionalInstructions = "Replace the person's existing footwear with the shoes from image 2. Ensure they are correctly angled and sized for the person's feet.";
        break;
      case 'pants':
        categoryContext = "pants/trousers/skirt";
        additionalInstructions = "Replace only the bottom-wear. Match the waistline and leg positions of the person.";
        break;
      case 'clothes':
        categoryContext = "top/shirt/jacket";
        additionalInstructions = "Replace only the top-wear. Ensure the collar and sleeves match the person's pose.";
        break;
      default:
        categoryContext = "outfit";
        additionalInstructions = "Replace the entire clothing set while maintaining the person's identity and pose.";
    }

    const prompt = `Advanced Virtual Try-On Task:
1. Target: The person in image 1.
2. Item to wear: The ${categoryContext} shown in image 2.
3. Core Action: Seamlessly dress the person from image 1 in the specific item from image 2.
4. Constraints: 
   - DO NOT change the person's face, hair, or background.
   - DO NOT change the person's body pose.
   - ${additionalInstructions}
   - Handle shadows, folds, and lighting realistically so it looks like a real photograph.
5. Final Output: Return ONLY the high-resolution photo of the person wearing the item. No text, no split screens, no side-by-side comparisons.`;

    const result = await ai.models.generateContent({
      model: modelName,
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
      }
    });

    const candidate = result.candidates?.[0];
    if (!candidate) throw new Error("AI 未返回结果，请稍后重试。");

    const imagePart = candidate.content.parts.find(p => p.inlineData);

    if (imagePart?.inlineData?.data) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart?.text) {
      throw new Error(`AI 无法生成: ${textPart.text}`);
    }

    throw new Error("模型未返回图像数据，请检查图片内容是否合规。");

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
