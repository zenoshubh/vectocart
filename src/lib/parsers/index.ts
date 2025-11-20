/**
 * Product parser utilities
 */
import { parseAmazon } from './amazon';
import { parseFlipkart } from './flipkart';
import { parseMeesho } from './meesho';
import type { ProductPlatform } from '@/types/products';
import type { ParsedProduct } from './amazon';

export { parseAmazon, parseFlipkart, parseMeesho };
export type { ParsedProduct };

/**
 * Detect platform from hostname
 */
export function detectPlatform(hostname: string): ProductPlatform | null {
  if (hostname.includes('amazon.')) {
    return 'amazon';
  }
  if (hostname.includes('flipkart.com')) {
    return 'flipkart';
  }
  if (hostname.includes('meesho.com')) {
    return 'meesho';
  }
  return null;
}

/**
 * Parse product based on platform
 */
export function parseProduct(platform: ProductPlatform): ParsedProduct {
  switch (platform) {
    case 'amazon':
      return parseAmazon();
    case 'flipkart':
      return parseFlipkart();
    case 'meesho':
      return parseMeesho();
    default:
      return {
        name: null,
        price: null,
        currency: null,
        rating: null,
        image: null,
      };
  }
}

