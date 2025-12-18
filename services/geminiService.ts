
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 增加跨域支持（如果需要）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { modelImage, itemImage, category } = req.body;

    if (!modelImage || !itemImage) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'API_KEY is not configured on the server' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const categoryLabel = category === 'shoes' ? 'shoes' : 'clothing';
    
    const prompt = `
      Task: Virtual AI Try-On.
      Input 1: Image of a person (the model).
      Input 2: Image of a piece of ${categoryLabel}.
      
      Instruction: 
      1. This is a high-end fashion try-on request.
      2. Extract the ${categoryLabel} from Input 2.
      3. Seamlessly and realistically blend it onto the person in Input 1.
      4. Precisely match the person's pose, lighting, and body shape.
      5. Preserve the person's identity and the original background.
      6. Output ONLY the resulting image as inline data.
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: modelImage.base64, mimeType: modelImage.mimeType } },
          { inlineData: { data: itemImage.base64, mimeType: itemImage.mimeType } },
          { text: prompt }
        ]
      }
    });

    const candidate = result.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(part => part.inlineData);

    if (imagePart?.inlineData) {
      return res.status(200).json({ 
        result: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` 
      });
    }

    // 如果没有返回图像，尝试检查文本（有时模型会返回拒绝理由）
    const textPart = candidate?.content?.parts?.find(part => part.text);
    throw new Error(textPart?.text || "AI failed to generate a resulting image. The images might be too complex or inappropriate.");

  } catch (error: any) {
    console.error("TryOn Function Error:", error);
    return res.status(500).json({ 
      error: error.message || "An unexpected error occurred during image processing." 
    });
  }
}
