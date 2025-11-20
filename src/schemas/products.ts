import { z } from 'zod';

export const ProductPlatformSchema = z.enum(['amazon', 'flipkart', 'meesho']);
export type ProductPlatform = z.infer<typeof ProductPlatformSchema>;

export const AddProductSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive').nullable().optional(),
  currency: z.string().min(1).max(10).nullable().optional(),
  rating: z.number().min(0).max(5, 'Rating must be between 0 and 5').nullable().optional(),
  image: z.string().url('Invalid image URL').nullable().optional(),
  url: z.string().url('Invalid product URL').min(1, 'Product URL is required'),
  platform: ProductPlatformSchema,
});

export type AddProductInput = z.infer<typeof AddProductSchema>;

export const ListProductsSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
});

export type ListProductsInput = z.infer<typeof ListProductsSchema>;

export const DeleteProductSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
});

export type DeleteProductInput = z.infer<typeof DeleteProductSchema>;

