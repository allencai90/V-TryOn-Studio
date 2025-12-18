
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { modelImage, itemImage, category } = await req.json();

    if (!process.env.API_KEY) {
      return new Response(JSON.stringify({ error: 'Server configuration error: API_KEY missing' }), { status: 500 });
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
      3. Match lighting and perspective.
      4. Maintain original facial features and background.
      5. Output ONLY the resulting high-res image.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: modelImage.base64, mimeType: modelImage.mimeType } },
          { inlineData: { data: itemImage.base64, mimeType: itemImage.mimeType } },
          { text: prompt }
        ]
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No response from AI");

    for (const part of parts) {
      if (part.inlineData) {
        return new Response(
          JSON.stringify({ result: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    throw new Error("No image data in AI response");

  } catch (error: any) {
    console.error("TryOn Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process image" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
