import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置跨域和内容类型
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { modelImage, itemImage, category } = req.body;

    if (!modelImage?.base64 || !itemImage?.base64) {
      return res.status(400).json({ error: '请上传模特照片和商品照片。' });
    }

    // 粗略检查大小 (Base64 1 char ≈ 0.75 byte)
    const estimatedSize = (modelImage.base64.length + itemImage.base64.length) * 0.75;
    if (estimatedSize > 4 * 1024 * 1024) {
      return res.status(413).json({ error: '图片总体积过大，请尝试压缩图片或上传较小的照片。Vercel 免费版限制请求需小于 4.5MB。' });
    }

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'API_KEY 未配置，请在 Vercel 环境变量中设置。' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const categoryLabel = category === 'shoes' ? 'footwear/shoes' : 'clothing/garment';
    
    // 极其严格的 Prompt
    const prompt = `
      AI Virtual Try-On Task:
      1. Reference Input 1: The model person.
      2. Reference Input 2: The ${categoryLabel} to be tried on.
      3. Action: Replace the original ${categoryLabel} on the model in Input 1 with the item from Input 2.
      4. Requirements:
         - Maintain the model's identity, pose, face, and background exactly.
         - Seamlessly blend textures, folds, and lighting.
         - If category is 'shoes', strictly replace the shoes while keeping the rest of the body.
      5. CRITICAL: Output ONLY the high-quality resulting image. No text, no markdown.
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

    // 如果没有返回图片，返回文本错误（Gemini 有时会返回拒答文本）
    const textPart = candidate?.content?.parts?.find(p => p.text);
    return res.status(500).json({ 
      error: textPart?.text || "AI 无法生成图片，可能是由于图片过于复杂或包含违规内容。" 
    });

  } catch (error: any) {
    console.error("Vercel API Error:", error);
    return res.status(500).json({ 
      error: `服务器处理异常: ${error.message || '未知错误'}` 
    });
  }
}
