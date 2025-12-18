import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 打印请求，方便在 Vercel 控制台查看
  console.log(`[API Internal] Handling ${req.method} request for ${req.url}`);

  // 设置 CORS 和 响应头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 健康检查
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: "success", 
      message: "API Route is active and reachable",
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed. Use POST.` });
  }

  try {
    const { modelImage, itemImage, category } = req.body;

    if (!modelImage?.base64 || !itemImage?.base64) {
      return res.status(400).json({ error: 'Missing image data in request body.' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing in environment variables!");
      return res.status(500).json({ error: 'Server configuration error: Missing API Key.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // 构建提示词
    const categoryLabel = category === 'shoes' ? 'footwear/shoes' : 'clothing/garment';
    const prompt = `Virtual Try-On Task: Take the ${categoryLabel} from the second image and naturally overlay it onto the person in the first image. Ensure high-quality blending, realistic shadows, and correct proportions. Output ONLY the resulting image.`;

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
      console.log("[API Success] Image generated successfully");
      return res.status(200).json({ 
        result: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` 
      });
    }

    const textPart = candidate?.content?.parts?.find(p => p.text);
    return res.status(500).json({ error: textPart?.text || "AI returned an empty response." });

  } catch (error: any) {
    console.error("[API Error Details]", error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
