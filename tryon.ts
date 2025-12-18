
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({ status: "online", model: "gemini-2.5-flash-image" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  try {
    const { modelImage, itemImage, category } = req.body;

    if (!modelImage?.base64 || !itemImage?.base64) {
      return res.status(400).json({ error: '请上传图片。' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: '服务器端 API_KEY 未配置。' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = 'gemini-2.5-flash-image';

    const prompt = `Virtual Try-On Fashion Task: Take the clothing from the second image and naturally overlay it onto the person in the first image. Ensure realistic blending, shadows, and correct human anatomy. Output ONLY the resulting image.`;

    const result = await ai.models.generateContent({
      model: modelName,
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

    return res.status(500).json({ error: "AI 未能生成图像，可能是因为额度超限。" });

  } catch (error: any) {
    console.error("Try-On Internal Error:", error);
    // 向前端转发具体的错误状态码
    const statusCode = error.message?.includes('429') ? 429 : error.message?.includes('403') ? 403 : 500;
    return res.status(statusCode).json({ error: error.message || 'Internal Server Error' });
  }
}
