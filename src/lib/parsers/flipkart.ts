/**
 * Flipkart product parser for browser extension
 * Uses JSON-LD schema (most reliable) with minimal DOM fallback
 * 
 * @returns Product information: { name, price, currency, rating, image }
 */
import type { ParsedProduct } from './amazon';

interface ProductSchema {
  '@type'?: string;
  name?: string;
  offers?: {
    price?: string | number;
    priceCurrency?: string;
  };
  aggregateRating?: {
    ratingValue?: string | number;
  };
  image?: string | string[];
}

export function parseFlipkart(): ParsedProduct {
  // Get JSON-LD schema data (most reliable source)
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  let productSchema: ProductSchema | null = null;

  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent ?? '') as ProductSchema | ProductSchema[];
      // Handle both single object and array
      const schemas = Array.isArray(data) ? data : [data];
      for (const schema of schemas) {
        if (schema['@type'] === 'Product') {
          productSchema = schema;
          break;
        }
      }
      if (productSchema) break;
    } catch (e) {
      continue;
    }
  }

  // Product Name - from JSON-LD schema (most reliable), fallback to DOM
  let name: string | null = null;
  if (productSchema?.name) {
    name = productSchema.name;
  } else {
    // DOM fallback: .B_NuCI is the standard Flipkart product title class
    const nameEl = document.querySelector('.B_NuCI');
    name = nameEl ? nameEl.textContent?.trim() ?? null : null;
  }

  // Price - from JSON-LD schema, fallback to DOM
  let price: number | null = null;
  let currency: string | null = 'INR';

  if (productSchema?.offers?.price) {
    price = parseFloat(String(productSchema.offers.price));
    currency = productSchema.offers.priceCurrency || 'INR';
  } else {
    // DOM fallback: ._30jeq3 is the current price class
    const priceEl = document.querySelector('._30jeq3');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() ?? '';
      const priceMatch = priceText.match(/₹?\s*([\d,]+)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/,/g, ''));
      }
    }
  }

  // Rating - from JSON-LD schema
  let rating: number | null = null;
  if (productSchema?.aggregateRating?.ratingValue) {
    rating = parseFloat(String(productSchema.aggregateRating.ratingValue));
  }

  // Image - from JSON-LD schema
  let image: string | null = null;
  if (productSchema?.image) {
    const imageData = productSchema.image;
    image = Array.isArray(imageData) ? imageData[0] : imageData;
    // Clean up image URL for better quality
    if (image) {
      image = image.replace(/\/\d+\/\d+\//, '/300/300/');
      image = image.replace(/\?q=\d+/, '?q=90');
    }
  }

  return {
    name,
    price,
    currency,
    rating,
    image,
  };
}

