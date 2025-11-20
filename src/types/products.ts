export type ProductPlatform = 'amazon' | 'flipkart' | 'meesho';

export interface Product {
  id: string;
  roomId: string;
  name: string;
  price: number | null;
  currency: string | null;
  rating: number | null;
  image: string | null;
  url: string;
  addedBy: string;
  addedAt: string;
  platform: ProductPlatform;
}

export interface AddProductInput {
  roomId: string;
  name: string;
  price?: number | null;
  currency?: string | null;
  rating?: number | null;
  image?: string | null;
  url: string;
  platform: ProductPlatform;
}

