
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge', // 使用 Edge Runtime 速度更快且免费额度高
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { modelImage, itemImage, category } = await req.json();

    if (!process.env.API_KEY) {
      return new Response(JSON.stringify({ error: 'API_KEY is not configured on the server' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const categoryLabel = category === 'shoes' ? 'shoes' : 'clothing';
    
    const prompt = `
      Task: Virtual AI Try-On.
      Input 1: Image of a person (the model).
      Input 2: Image of a piece of ${categoryLabel}.
      
      Instruction: 
      1. Extract the ${categoryLabel} from Input 2.
      2. Seamlessly blend it onto the person in Input 1.
      3. Ensure lighting, perspective, and fabric texture match the environment and pose.
      4. Maintain the person's features, skin tone, and background from Input 1.
      5. The final output must be only the high-resolution image of the person wearing the item.
      6. If shoes, replace existing footwear. If clothes, replace upper/lower garment.
    `;

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

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("Invalid response from Gemini API");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return new Response(
          JSON.stringify({ 
            result: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` 
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    throw new Error("No image data returned from model");

  } catch (error: any) {
    console.error("Server Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500 }
    );
  }
}
