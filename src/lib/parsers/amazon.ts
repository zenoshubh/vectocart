/**
 * Amazon product parser for browser extension
 * Uses only the most reliable selectors - no fallbacks
 * 
 * @returns Product information: { name, price, currency, rating, image }
 */
export interface ParsedProduct {
  name: string | null;
  price: number | null;
  currency: string | null;
  rating: number | null;
  image: string | null;
}

/**
 * Wait for an element to appear in the DOM
 */
function waitForElement(selector: string, timeout = 2000): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

export function parseAmazon(): ParsedProduct {
  // Product Name - ID selector is most reliable
  const nameEl = document.getElementById('productTitle');
  const name = nameEl ? nameEl.textContent?.trim() ?? null : null;

  // Price - .a-price-whole is the correct selector for Amazon
  // This contains the actual price number
  let priceEl: Element | null = null;
  let priceText = '';
  
  // Primary selector: .a-price-whole (the correct one)
  priceEl = document.querySelector('.a-price-whole');
  
  // If not found, try within .a-price container
  if (!priceEl) {
    priceEl = document.querySelector('.a-price .a-price-whole');
  }
  
  // Fallback: try .a-offscreen (from test project, but .a-price-whole is preferred)
  if (!priceEl) {
    priceEl = document.querySelector('.a-price .a-offscreen');
  }
  
  // If not found, try finding .a-price container first, then .a-price-whole within it
  if (!priceEl) {
    const priceContainer = document.querySelector('.a-price');
    if (priceContainer) {
      priceEl = priceContainer.querySelector('.a-price-whole') || 
                priceContainer.querySelector('.a-offscreen');
    }
  }
  
  // Try priceblock selectors with .a-price-whole first
  if (!priceEl) {
    priceEl = document.querySelector('#priceblock_dealprice .a-price-whole') ||
              document.querySelector('#priceblock_saleprice .a-price-whole') ||
              document.querySelector('#priceblock_ourprice .a-price-whole') ||
              document.querySelector('#priceblock_dealprice .a-offscreen') ||
              document.querySelector('#priceblock_saleprice .a-offscreen') ||
              document.querySelector('#priceblock_ourprice .a-offscreen');
  }
  
  let price: number | null = null;
  let currency: string | null = null;
  
  if (priceEl) {
    priceText = priceEl.textContent?.trim() ?? '';
    // Extract number from textContent, regex: /[\d,]+\.?\d*/
    const priceMatch = priceText.match(/[\d,]+\.?\d*/);
    if (priceMatch) {
      price = parseFloat(priceMatch[0].replace(/,/g, ''));
      // Detect currency from price text - check if text contains ₹ (INR)
      // Since we only support amazon.in, default to INR
      if (priceText.includes('₹')) {
        currency = 'INR';
      } else {
        // Default to INR for amazon.in
        currency = 'INR';
      }
    }
  }
  
  // Currency - check for .a-price-symbol element (most reliable)
  if (price && !currency && priceEl) {
    const currencyEl = document.querySelector('.a-price-symbol');
    if (currencyEl) {
      const currencyText = currencyEl.textContent?.trim() || '';
      if (currencyText.includes('₹')) {
        currency = 'INR';
      }
    }
    // Also check parent container or nearby elements for currency symbol
    if (!currency) {
    const priceContainer = priceEl.closest('.a-price');
    if (priceContainer) {
      const containerText = priceContainer.textContent || '';
      if (containerText.includes('₹')) currency = 'INR';
      }
    }
    // Final fallback: default to INR for amazon.in
    if (!currency) {
      currency = 'INR';
    }
  }
  
  // Debug logging - use window.console to ensure it's visible
  const allPriceWholeElements = document.querySelectorAll('.a-price-whole');
  const allPriceContainers = document.querySelectorAll('.a-price');
  try {
    window.console.log('[VectoCart] Amazon price extraction', {
      foundPriceEl: !!priceEl,
      price,
      currency,
      priceText: priceText || priceEl?.textContent?.trim() || 'N/A',
      selector: '.a-price-whole (primary)',
      priceWholeElementsFound: allPriceWholeElements.length,
      priceContainersFound: allPriceContainers.length,
      priceElementHTML: priceEl?.outerHTML?.substring(0, 200) || 'N/A',
      url: window.location.href,
    });
  } catch (e) {
    // Fallback if console is not available
  }

  // Rating - from .a-size-small.a-color-base with aria-hidden="true"
  let rating: number | null = null;
  const ratingEl = document.querySelector('.a-size-small.a-color-base[aria-hidden="true"]');
  
  if (ratingEl) {
    const ratingText = ratingEl.textContent?.trim() || '';
    const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
    if (ratingMatch) {
      rating = parseFloat(ratingMatch[1]);
    }
  }
  
  // Fallback: try #acrPopover .a-icon-alt
  if (!rating) {
    const ratingElFallback = document.querySelector('#acrPopover .a-icon-alt');
    if (ratingElFallback) {
      const ratingText = ratingElFallback.getAttribute('aria-label') || ratingElFallback.textContent || '';
      const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*(?:out of|\/)\s*5/);
      if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
      }
    }
  }

  // Image - landingImage is the main product image
  const imageEl = document.getElementById('landingImage');
  let image: string | null = null;
  
  if (imageEl) {
    image = imageEl.getAttribute('src');
    // Clean up image URL for higher quality
    if (image) {
      image = image.replace(/\._SY\d+_\.jpg/, '._SL1500_.jpg');
      image = image.replace(/\._SY\d+_\./, '._SL1500_.');
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

