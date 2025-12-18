
import { GoogleGenAI } from "@google/genai";
import { ImageData, Category } from "../types";

export const performTryOn = async (
  modelImage: ImageData,
  itemImage: ImageData,
  category: Category
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const categoryLabel = category === 'shoes' ? 'shoes' : 'clothing';
  
  const prompt = `
    Task: Virtual AI Try-On.
    Input 1: Image of a person (the model).
    Input 2: Image of a piece of ${categoryLabel}.
    
    Instruction: 
    1. Extract the ${categoryLabel} from Input 2.
    2. Seamlessly blend it onto the person in Input 1.
    3. Ensure the lighting, perspective, and fabric texture match the environment and the model's pose.
    4. Maintain the person's facial features, skin tone, and background from Input 1.
    5. The final output must be only the high-resolution image of the person wearing the item.
    6. If the item is shoes, replace existing footwear. If it is clothes, replace the corresponding upper or lower garment.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: modelImage.base64,
              mimeType: modelImage.mimeType,
            },
          },
          {
            inlineData: {
              data: itemImage.base64,
              mimeType: itemImage.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data returned from the model.");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
