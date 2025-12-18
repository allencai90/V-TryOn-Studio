import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { modelImage, itemImage, category } = req.body;

    if (!modelImage?.base64 || !itemImage?.base64) {
      return res.status(400).json({ error: '请上传模特图和商品图' });
    }

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: '服务端未配置 API_KEY' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const categoryLabel = category === 'shoes' ? 'footwear/shoes' : 'clothing/garment';
    
    const prompt = `
      AI Virtual Try-On Task:
      1. Reference 1: The model person.
      2. Reference 2: The ${categoryLabel} to be tried on.
      3. Action: Replace the ${categoryLabel} on the person in Reference 1 with the item in Reference 2.
      4. Output: ONLY the resulting high-quality photo. No text.
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
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

    if (imagePart?.inlineData?.data) {
      return res.status(200).json({ 
        result: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` 
      });
    }

    const textPart = candidate?.content?.parts?.find(p => p.text);
    return res.status(500).json({ error: textPart?.text || "AI 无法生成图片内容" });

  } catch (error: any) {
    console.error("TryOn API Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
