import type { VoteType } from './votes';

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
  // Vote-related fields (optional, may not always be loaded)
  upvoteCount?: number;
  downvoteCount?: number;
  netScore?: number;
  userVote?: VoteType | null;
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

