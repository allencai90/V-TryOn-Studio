import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (req: VercelRequest, res: VercelResponse) {
  // 必须立即设置响应头为 JSON，防止被误判为 HTML
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 验证接口是否正常部署的关键（浏览器直接访问此处）
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: "online", 
      api_route: "active",
      message: "Serverless Function is reachable!",
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed. Use POST.` });
  }

  try {
    const { modelImage, itemImage, category } = req.body;

    if (!modelImage?.base64 || !itemImage?.base64) {
      return res.status(400).json({ error: 'Images are required.' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API_KEY is not configured in Vercel Environment Variables.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const categoryLabel = category === 'shoes' ? 'footwear' : 'clothing';
    const prompt = `Virtual Try-On: Take the ${categoryLabel} from the second image and naturally overlay it onto the person in the first image. Ensure realistic blending and lighting. Output ONLY the resulting image.`;

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

    return res.status(500).json({ error: "AI failed to generate visual data." });

  } catch (error: any) {
    console.error("Try-On Internal Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
