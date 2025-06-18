// Content script for VectoCart
console.log('VectoCart content script loaded')

// E-commerce site configurations
const siteConfigs = {
  'amazon.in': {
    name: 'Amazon',
    selectors: {
      productName: '#productTitle, [data-cy="product-title"], .product-title, h1.a-size-large',
      price: '.a-price-whole, .a-offscreen, [data-cy="price-recipe"], .a-price .a-offscreen, .a-price-range .a-offscreen',
      image: '#landingImage, [data-cy="product-image"] img, .a-dynamic-image, #imgBlkFront'
    },
    urlPattern: /\/dp\/|\/gp\/product\/|\/product\//
  },
  'amazon.com': {
    name: 'Amazon',
    selectors: {
      productName: '#productTitle, .product-title, h1.a-size-large',
      price: '.a-price-whole, .a-offscreen, .a-price .a-offscreen',
      image: '#landingImage, .a-dynamic-image, #imgBlkFront'
    },
    urlPattern: /\/dp\/|\/gp\/product\/|\/product\//
  },
  'flipkart.com': {
    name: 'Flipkart',
    selectors: {
      productName: '.B_NuCI, ._35KyD6, .x2Jym8, h1[class*="title"], .yhB1nd, span.B_NuCI',
      price: '._30jeq3, ._1_WHN1, ._3I9_wc, ._1vC4OE, div[class*="price"]',
      image: '._396cs4 img, ._2r_T1I img, img[class*="image"], ._2amPTt img, ._53J4C- img'
    },
    urlPattern: /\/p\/|\/product\//
  },
  'myntra.com': {
    name: 'Myntra',
    selectors: {
      productName: '.pdp-product-name, .pdp-name, h1[class*="title"], .product-title, h1.pdp-name',
      price: '.pdp-price strong, .product-discountedPrice, .pdp-discountedPrice, span[class*="price"]',
      image: '.image-grid-image, .product-image img, img[class*="image"], .image-grid-imageContainer img, .common-image'
    },
    urlPattern: /\/[0-9]+\/buy|\/product\//
  },
  'ajio.com': {
    name: 'AJIO',
    selectors: {
      productName: '.prod-name, .product-name, h1[class*="name"], .pdp-product-name',
      price: '.prod-sp, .product-price, .price-info, span[class*="price"]',
      image: '.prod-image img, .product-image img, img[class*="image"], .rilrtl-lazy-img'
    },
    urlPattern: /\/p\/|\/product\//
  },
  'meesho.com': {
    name: 'Meesho',
    selectors: {
      productName: '[data-testid="product-title"], h1[class*="title"], .product-title, h1',
      price: '[data-testid="product-price"], .product-price, span[class*="price"], .ProductViews__PriceContainer span',
      image: '[data-testid="product-image"] img, img[class*="image"], .ProductImageCarousel__Image img, img[alt*="product"]'
    },
    urlPattern: /\/p\/|\/product\//
  }
}

// Get current site configuration
function getCurrentSiteConfig() {
  const hostname = window.location.hostname.replace('www.', '')
  return siteConfigs[hostname]
}

// Extract product information with better error handling
function extractProductInfo() {
  const siteConfig = getCurrentSiteConfig()
  if (!siteConfig) {
    console.log('VectoCart: Site not supported')
    return null
  }

  // Check if we're on a product page
  if (!siteConfig.urlPattern.test(window.location.pathname)) {
    console.log('VectoCart: Not a product page')
    return null
  }

  // Helper function to try multiple selectors
  const getElementBySelectors = (selectors) => {
    const selectorList = selectors.split(', ')
    for (const selector of selectorList) {
      const element = document.querySelector(selector.trim())
      if (element) return element
    }
    return null
  }

  // Extract product name with fallbacks
  const productNameElement = getElementBySelectors(siteConfig.selectors.productName)
  let productName = productNameElement?.textContent?.trim()
  
  // Fallback for product name if not found
  if (!productName) {
    const titleElement = document.querySelector('title')
    productName = titleElement?.textContent?.trim()
    // Clean up common title suffixes
    if (productName) {
      productName = productName.replace(/\s*[-|:]\s*(Buy|Shop|Online|Price|Amazon|Flipkart|Myntra|AJIO|Meesho).*$/i, '')
    }
  }

  if (!productName || productName.length < 3) {
    console.log('VectoCart: Could not extract product name')
    return null
  }

  // Extract price with better parsing
  const priceElement = getElementBySelectors(siteConfig.selectors.price)
  let price = null
  
  if (priceElement) {
    const priceText = priceElement.textContent?.trim()
    console.log('VectoCart: Found price text:', priceText)
    
    // More comprehensive price extraction
    const pricePatterns = [
      /₹[\s]*([\d,]+)/,           // ₹ 1,234
      /Rs\.?\s*([\d,]+)/i,        // Rs. 1234 or Rs 1234
      /INR[\s]*([\d,]+)/i,        // INR 1234
      /([\d,]+)[\s]*₹/,           // 1234₹
      /\$[\s]*([\d,]+)/,          // $1234
      /([\d,]+)/                  // Just numbers as fallback
    ]
    
    for (const pattern of pricePatterns) {
      const match = priceText?.match(pattern)
      if (match && match[1]) {
        price = parseInt(match[1].replace(/,/g, ''))
        if (price > 0) break
      }
    }
  }

  // Extract image with better fallbacks
  const imageElement = getElementBySelectors(siteConfig.selectors.image)
  let imageUrl = null
  
  if (imageElement) {
    // Try different image source attributes
    imageUrl = imageElement.src || 
               imageElement.getAttribute('data-src') || 
               imageElement.getAttribute('data-lazy-src') ||
               imageElement.getAttribute('data-original') ||
               imageElement.getAttribute('srcset')?.split(' ')[0]
    
    // For Myntra and AJIO, sometimes images are in CSS background
    if (!imageUrl && window.getComputedStyle) {
      const bgImage = window.getComputedStyle(imageElement.parentElement || imageElement).backgroundImage
      if (bgImage && bgImage !== 'none') {
        const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/)
        if (urlMatch) imageUrl = urlMatch[1]
      }
    }
  }

  // Additional image fallbacks for specific sites
  if (!imageUrl) {
    const hostname = window.location.hostname.replace('www.', '')
    
    if (hostname === 'myntra.com') {
      // Try Myntra specific image selectors
      const myntraImages = document.querySelectorAll('img[src*="assets.myntassets.com"], img[src*="myntra.com"]')
      for (const img of myntraImages) {
        if (img.src && img.src.includes('assets.myntassets.com')) {
          imageUrl = img.src
          break
        }
      }
    } else if (hostname === 'ajio.com') {
      // Try AJIO specific image selectors
      const ajioImages = document.querySelectorAll('img[src*="ajio.com"], img[src*="ajioimages.com"]')
      for (const img of ajioImages) {
        if (img.src && (img.src.includes('ajio.com') || img.src.includes('ajioimages.com'))) {
          imageUrl = img.src
          break
        }
      }
    }
  }

  console.log('VectoCart: Extracted product info:', {
    name: productName,
    price: price,
    image: imageUrl,
    platform: siteConfig.name
  })

  return {
    name: productName,
    price: price,
    image: imageUrl,
    url: window.location.href,
    platform: siteConfig.name
  }
}

// Create VectoCart button
function createVectoCartButton() {
  const button = document.createElement('button')
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="m1 1 4 4 12.5 3 2.5 10H7"></path>
    </svg>
    Add to VectoCart
  `
  button.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    z-index: 10000;
    position: relative;
  `
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)'
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
  })
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)'
    button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'
  })

  button.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const productInfo = extractProductInfo()
    if (!productInfo) {
      showToast('Unable to extract product information', 'error')
      return
    }

    // Send product to background script
    chrome.runtime.sendMessage({
      action: 'addProduct',
      product: productInfo
    }, (response) => {
      if (response?.success) {
        showToast('Product added to VectoCart!', 'success')
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"></path>
          </svg>
          Added to VectoCart
        `
        button.style.background = '#10b981'
        setTimeout(() => {
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="m1 1 4 4 12.5 3 2.5 10H7"></path>
            </svg>
            Add to VectoCart
          `
          button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }, 2000)
      } else {
        showToast(response?.message || 'Please join a room first', 'error')
      }
    })
  })

  return button
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    z-index: 10001;
    transition: all 0.3s ease;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  `
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(100%)'
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 3000)
}

// Add button to page with improved targeting
function addVectoCartButton() {
  const siteConfig = getCurrentSiteConfig()
  if (!siteConfig) return

  // Check if we're on a product page
  if (!siteConfig.urlPattern.test(window.location.pathname)) return

  // Remove existing button
  const existingButton = document.querySelector('#vectocart-add-button')
  if (existingButton) {
    existingButton.remove()
  }

  const button = createVectoCartButton()
  button.id = 'vectocart-add-button'

  // Site-specific button placement with multiple fallbacks
  let targetElement = null
  const hostname = window.location.hostname.replace('www.', '')
  
  if (hostname.includes('amazon')) {
    const selectors = [
      '#addToCart_feature_div',
      '#desktop_buybox',
      '.a-button-stack',
      '#addToCart',
      '#buy-now-button',
      '.buybox-grid-cell'
    ]
    for (const selector of selectors) {
      targetElement = document.querySelector(selector)
      if (targetElement) break
    }
  } else if (hostname === 'flipkart.com') {
    const selectors = [
      '._1YokD2',
      '._2KpZ6l', 
      '.yhB1nd',
      '._6a4lJe',
      '._3sKhUH',
      '._7UHT_c',
      '[data-testid="add-to-cart"]'
    ]
    for (const selector of selectors) {
      targetElement = document.querySelector(selector)
      if (targetElement) {
        targetElement = targetElement.parentElement
        break
      }
    }
  } else if (hostname === 'myntra.com') {
    const selectors = [
      '.pdp-add-to-bag',
      '.product-actions',
      '.pdp-product-action-row',
      '.product-cta',
      '.pdp-buttons'
    ]
    for (const selector of selectors) {
      targetElement = document.querySelector(selector)
      if (targetElement) break
    }
  } else if (hostname === 'ajio.com') {
    const selectors = [
      '.prod-add-to-bag',
      '.product-actions',
      '.ril-action-cta',
      '.ril-pdp-cta-buttons',
      '.product-cta'
    ]
    for (const selector of selectors) {
      targetElement = document.querySelector(selector)
      if (targetElement) break
    }
  } else if (hostname === 'meesho.com') {
    const selectors = [
      '[data-testid="add-to-cart"]',
      '.AddToCart__AddToCartContainer',
      '.ProductViews__ProductActionContainer',
      '.product-actions'
    ]
    for (const selector of selectors) {
      targetElement = document.querySelector(selector)
      if (targetElement) {
        targetElement = targetElement.parentElement
        break
      }
    }
  }

  // Universal fallbacks if site-specific selectors fail
  if (!targetElement) {
    const fallbackSelectors = [
      'button[class*="add-to-cart"]',
      'button[class*="buy"]',
      'button[class*="cart"]',
      '.product-actions',
      '.product-buttons',
      '.cta-buttons',
      '.add-to-bag',
      '.buy-now'
    ]
    
    for (const selector of fallbackSelectors) {
      const element = document.querySelector(selector)
      if (element) {
        targetElement = element.parentElement
        break
      }
    }
  }

  // If still no target, try to find a good container
  if (!targetElement) {
    // Look for common container patterns
    const containers = document.querySelectorAll('div[class*="product"], div[class*="details"], div[class*="info"], div[class*="cta"]')
    for (const container of containers) {
      if (container.offsetHeight > 50 && container.offsetWidth > 200) {
        targetElement = container
        break
      }
    }
  }

  // Last resort: add to body with fixed positioning
  if (!targetElement) {
    targetElement = document.body
    button.style.position = 'fixed'
    button.style.top = '20px'
    button.style.right = '20px'
    button.style.zIndex = '10000'
    button.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
  } else {
    button.style.margin = '12px 0'
  }

  // Add the button
  if (targetElement) {
    try {
      targetElement.appendChild(button)
      console.log('VectoCart: Button added successfully to', targetElement.className || targetElement.tagName)
    } catch (error) {
      console.log('VectoCart: Failed to add button, using fallback position')
      document.body.appendChild(button)
      button.style.position = 'fixed'
      button.style.top = '20px'
      button.style.right = '20px'
      button.style.zIndex = '10000'
    }
  }
}

// Context menu handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addProductFromContext') {
    const productInfo = extractProductInfo()
    if (productInfo) {
      chrome.runtime.sendMessage({
        action: 'addProduct',
        product: productInfo
      }, sendResponse)
    } else {
      sendResponse({ success: false, message: 'Unable to extract product information' })
    }
    return true
  }
})

// Initialize with better timing and retry logic
function init() {
  console.log('VectoCart: Initializing content script')
  
  // Function to add button with retries
  const tryAddButton = (retryCount = 0) => {
    const maxRetries = 5
    const delay = 1000 * (retryCount + 1) // Increasing delay
    
    setTimeout(() => {
      const siteConfig = getCurrentSiteConfig()
      if (siteConfig && siteConfig.urlPattern.test(window.location.pathname)) {
        // Check if we can extract product info (indicates page is loaded)
        const productInfo = extractProductInfo()
        if (productInfo && productInfo.name) {
          addVectoCartButton()
          console.log('VectoCart: Successfully added button after', retryCount, 'retries')
        } else if (retryCount < maxRetries) {
          console.log('VectoCart: Product info not ready, retrying...')
          tryAddButton(retryCount + 1)
        } else {
          console.log('VectoCart: Max retries reached, adding button anyway')
          addVectoCartButton()
        }
      }
    }, retryCount === 0 ? 500 : delay) // Initial delay shorter
  }

  // Add button on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryAddButton())
  } else {
    tryAddButton()
  }

  // Handle navigation (for SPAs) with improved detection
  let currentUrl = window.location.href
  let lastCheck = Date.now()
  
  const observer = new MutationObserver((mutations) => {
    const now = Date.now()
    
    // Throttle checks to avoid excessive calls
    if (now - lastCheck < 500) return
    lastCheck = now
    
    // Check for URL changes
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href
      console.log('VectoCart: URL changed to', currentUrl)
      setTimeout(() => tryAddButton(), 1000)
      return
    }
    
    // Check for significant DOM changes that might indicate new content
    const hasSignificantChanges = mutations.some(mutation => {
      return mutation.addedNodes.length > 0 && 
             Array.from(mutation.addedNodes).some(node => 
               node.nodeType === 1 && // Element node
               (node.matches && (
                 node.matches('[class*="product"]') ||
                 node.matches('[class*="price"]') ||
                 node.matches('[class*="title"]') ||
                 node.matches('[class*="image"]') ||
                 node.matches('[class*="button"]')
               ))
             )
    })
    
    if (hasSignificantChanges) {
      console.log('VectoCart: Significant DOM changes detected')
      setTimeout(() => tryAddButton(), 1500)
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  })

  // Additional check for sites that load content via AJAX
  setTimeout(() => {
    if (!document.querySelector('#vectocart-add-button')) {
      console.log('VectoCart: Button not found after initial load, retrying...')
      tryAddButton()
    }
  }, 3000)
}

init()