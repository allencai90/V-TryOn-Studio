import { ImageData, Category } from "../types";

export const performTryOn = async (
  modelImage: ImageData,
  itemImage: ImageData,
  category: Category
): Promise<string> => {
  try {
    const response = await fetch('/api/tryon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelImage,
        itemImage,
        category,
      }),
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON:", responseText);
      if (responseText.includes("413") || responseText.includes("Too Large")) {
        throw new Error("图片总体积超限 (Vercel 4.5MB 限制)，请使用更小的图片。");
      }
      throw new Error(`服务器返回了非预期格式 (Status: ${response.status})。可能是接口路径配置有误。`);
    }
    
    if (!response.ok) {
      throw new Error(data.error || `请求失败 (${response.status})`);
    }

    if (!data.result) {
      throw new Error(data.error || "未收到生成的图片数据。");
    }
    
    return data.result;
  } catch (error: any) {
    console.error("Request Error:", error);
    throw error;
  }
};
