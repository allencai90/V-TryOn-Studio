
export type Category = 'clothes' | 'shoes' | 'pants' | 'swimwear' | 'full-outfit';

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface GenerationState {
  modelImage: ImageData | null;
  itemImage: ImageData | null;
  category: Category;
  loading: boolean;
  result: string | null;
  error: string | null;
}
