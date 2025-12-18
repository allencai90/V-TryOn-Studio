
import { ImageData, Category } from "../types";

/**
 * 现在这个函数不再直接持有 API Key
 * 而是像发送短信一样，把数据发给我们的后端代理 (api/tryon.ts)
 */
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error: any) {
    console.error("Request Error:", error);
    throw error;
  }
};
