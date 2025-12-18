import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 调试用：支持 GET 访问
  if (req.method === 'GET') {
    return res.status(200).json({ message: "TryOn API is online. Use POST to generate images." });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { modelImage, itemImage, category } = req.body;

    if (!modelImage?.base64 || !itemImage?.base64) {
      return res.status(400).json({ error: '请上传两张图片' });
    }

    if (!process.env.API_KEY) {
      console.error("Missing API_KEY env variable");
      return res.status(500).json({ error: '服务器配置错误' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const categoryLabel = category === 'shoes' ? 'footwear' : 'clothing';
    const prompt = `Virtual Try-On: Seamlessly put the ${categoryLabel} from the second image onto the person in the first image. Keep original background and person facial features. Output only the image.`;

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
    return res.status(500).json({ error: textPart?.text || "AI 响应异常" });

  } catch (error: any) {
    console.error("API Handler Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
