/**
 * Platform detection utilities for content script
 */

import type { ProductPlatform } from '@/types/products';

/**
 * Checks if the current page is a product page based on hostname and pathname
 */
export function isProductPage(hostname: string): boolean {
  const pathname = window.location.pathname;
  
  if (hostname.includes('amazon.in')) {
    // Amazon product pages typically have /dp/ or /gp/product/ in URL
    // Also check for /product/ pattern
    return pathname.includes('/dp/') || 
           pathname.includes('/gp/product/') || 
           pathname.includes('/product/');
  }
  if (hostname.includes('flipkart.com')) {
    // Flipkart product pages have /p/ in URL
    return pathname.includes('/p/');
  }
  if (hostname.includes('meesho.com')) {
    // Meesho product pages have /p/ in URL
    return pathname.includes('/p/');
  }
  return false;
}

