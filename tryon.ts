import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[API Request] ${req.method} ${req.url}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: "online", 
      message: "API Route is working correctly",
      env_key_exists: !!process.env.API_KEY
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { modelImage, itemImage, category } = req.body;

    if (!modelImage?.base64 || !itemImage?.base64) {
      return res.status(400).json({ error: 'Missing images' });
    }

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'Server API Key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const categoryLabel = category === 'shoes' ? 'footwear' : 'clothing';
    const prompt = `Virtual Try-On: Seamlessly overlay the ${categoryLabel} from the second image onto the person in the first image. Output ONLY the image.`;

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

    const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (imagePart?.inlineData?.data) {
      return res.status(200).json({ 
        result: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` 
      });
    }

    return res.status(500).json({ error: "AI failed to generate visual output" });

  } catch (error: any) {
    console.error("[API Error]", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
