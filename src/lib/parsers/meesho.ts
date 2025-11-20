/**
 * Meesho product parser for browser extension
 * Uses JSON-LD schema (most reliable) - Meesho provides comprehensive structured data
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

export function parseMeesho(): ParsedProduct {
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

  // Product Name - from JSON-LD schema (most reliable)
  let name: string | null = null;
  if (productSchema?.name) {
    name = productSchema.name;
  } else {
    // DOM fallback: .sc-dOfePm.bIeHMb (h1 with product name)
    const nameEl = document.querySelector('h1.sc-dOfePm.bIeHMb, .sc-dOfePm.bIeHMb');
    if (nameEl) {
      name = nameEl.textContent?.trim() ?? null;
    } else {
      // Fallback: title tag or meta og:title
    const titleEl = document.querySelector('title');
    if (titleEl) {
      name = titleEl.textContent?.trim() ?? null;
    } else {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      name = ogTitle ? ogTitle.getAttribute('content') : null;
      }
    }
  }

  // Price - from JSON-LD schema, fallback to DOM
  let price: number | null = null;
  let currency: string | null = 'INR';

  if (productSchema?.offers?.price) {
    price = parseFloat(String(productSchema.offers.price));
    currency = productSchema.offers.priceCurrency || 'INR';
  } else {
    // DOM fallback: h4.sc-dOfePm.haKcEH or .sc-dOfePm.haKcEH
    const priceEl = document.querySelector('h4.sc-dOfePm.haKcEH, .sc-dOfePm.haKcEH');
    if (priceEl) {
      const priceText = priceEl.textContent?.trim() ?? '';
      // Remove HTML comments and extract number
      const cleanPriceText = priceText.replace(/<!--[\s\S]*?-->/g, '');
      const priceMatch = cleanPriceText.match(/₹?\s*([\d,]+)/);
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
    // DOM fallback: .sc-dOfePm.jklcNf
    const ratingEl = document.querySelector('.sc-dOfePm.jklcNf');
    if (ratingEl) {
      const ratingText = ratingEl.textContent?.trim() ?? '';
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
      }
    }
  }

  // Image - from JSON-LD schema (first image in array), fallback to DOM
  let image: string | null = null;
  if (productSchema?.image) {
    const imageData = productSchema.image;
    image = Array.isArray(imageData) ? imageData[0] : imageData;
    // Clean up image URL for better quality (remove width parameter or increase it)
    if (image) {
      image = image.replace(/\?width=\d+/, '?width=800');
      image = image.replace(/_512\.(avif|webp|jpg)/, '_800.$1');
    }
  } else {
    // DOM fallback: .AvifImage__ImageWrapper-sc-1055enk-0.qHEhj or .qHEhj
    const imageEl = document.querySelector('.AvifImage__ImageWrapper-sc-1055enk-0.qHEhj img, .qHEhj img, img.qHEhj');
    if (imageEl && imageEl.tagName === 'IMG') {
      image = (imageEl as HTMLImageElement).src;
      // Clean up image URL for better quality
    if (image) {
      image = image.replace(/\?width=\d+/, '?width=800');
      image = image.replace(/_512\.(avif|webp|jpg)/, '_800.$1');
    }
  } else {
    // Fallback to og:image
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      image = ogImage.getAttribute('content');
      if (image) {
        image = image.replace(/\?width=\d+/, '?width=800');
        image = image.replace(/_512\.(avif|webp|jpg)/, '_800.$1');
        }
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

