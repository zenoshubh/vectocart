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
    // DOM fallback: .VU-ZEz is the current Flipkart product title class
    const nameEl = document.querySelector('.VU-ZEz');
    name = nameEl ? nameEl.textContent?.trim() ?? null : null;
  }

  // Price - from JSON-LD schema, fallback to DOM
  let price: number | null = null;
  let currency: string | null = 'INR';

  if (productSchema?.offers?.price) {
    price = parseFloat(String(productSchema.offers.price));
    currency = productSchema.offers.priceCurrency || 'INR';
  } else {
    // DOM fallback: .Nx9bqj.CxhGGd is the current price class
    const priceEl = document.querySelector('.Nx9bqj.CxhGGd');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() ?? '';
      const priceMatch = priceText.match(/₹?\s*([\d,]+)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/,/g, ''));
      }
    }
  }

  // Rating - from JSON-LD schema, fallback to DOM
  let rating: number | null = null;
  if (productSchema?.aggregateRating?.ratingValue) {
    rating = parseFloat(String(productSchema.aggregateRating.ratingValue));
  } else {
    // DOM fallback: .XQDdHH contains the rating
    const ratingEl = document.querySelector('.XQDdHH');
    if (ratingEl) {
      const ratingText = ratingEl.textContent?.trim() ?? '';
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
      }
    }
  }

  // Image - from JSON-LD schema, fallback to DOM
  let image: string | null = null;
  if (productSchema?.image) {
    const imageData = productSchema.image;
    image = Array.isArray(imageData) ? imageData[0] : imageData;
    // Clean up image URL for better quality
    if (image) {
      image = image.replace(/\/\d+\/\d+\//, '/300/300/');
      image = image.replace(/\?q=\d+/, '?q=90');
    }
  } else {
    // DOM fallback: .DByuf4, .IZexXJ, or .jLEJ7H classes
    const imageEl = document.querySelector('.DByuf4, .IZexXJ, .jLEJ7H');
    if (imageEl && imageEl.tagName === 'IMG') {
      image = (imageEl as HTMLImageElement).src;
      // Clean up image URL for better quality
      if (image) {
        image = image.replace(/\/\d+\/\d+\//, '/832/832/');
        image = image.replace(/\?q=\d+/, '?q=90');
      }
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

