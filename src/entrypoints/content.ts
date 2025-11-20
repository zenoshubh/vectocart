import './content/button.css';
import { logger } from '@/lib/logger';
import { detectPlatform, parseProduct } from '@/lib/parsers';
import type { ProductPlatform } from '@/types/products';
import { isProductPage } from '@/lib/content-script/platform';
import { createButton, setButtonText } from '@/lib/content-script/button';
import { createDropdown } from '@/lib/content-script/dropdown';
import { showToast } from '@/lib/content-script/toast';
import { checkAuth, fetchRooms, openSidepanel, addProductToRoom } from '@/lib/content-script/api';

// Type for content script context - use any to avoid type conflicts with WXT's internal types
type ContentScriptContext = any;

/**
 * Mounts the VectoCart button in the shadow root
 */
function mountButton(ctx: ContentScriptContext, platform: ProductPlatform, shadowRoot: ShadowRoot) {
  if (!ctx.isValid) return;
  
  const button = createButton();
  button.style.position = 'relative'; // For dropdown positioning
  button.style.width = '100%'; // Ensure button takes full width of container
  let dropdown: HTMLElement | null = null;
  let isLoading = false;
  
  const handleClick = async () => {
    if (isLoading || !ctx.isValid) return;
    
    // Close dropdown if open
    if (dropdown) {
      // Add closing animation
      dropdown.style.animation = 'dropdownSlideOut 0.2s ease-in forwards';
      ctx.setTimeout(() => {
        dropdown?.remove();
        dropdown = null;
      }, 200);
      return;
    }
    
    // Check authentication
    isLoading = true;
    button.disabled = true;
    
    const auth = await checkAuth(ctx);
    
    if (!auth.isAuthenticated) {
      isLoading = false;
      button.disabled = false;
      setButtonText(button, 'Add to VectoCart');
      
      await openSidepanel(ctx, (message, type) => showToast(message, type, ctx));
      showToast('Please sign in to add products', 'error', ctx);
      return;
    }
    
    // Fetch rooms
    const rooms = await fetchRooms(ctx);
    
    isLoading = false;
    button.disabled = false;
    setButtonText(button, 'Add to VectoCart');
    
    if (rooms.length === 0) {
      await openSidepanel(ctx, (message, type) => showToast(message, type, ctx));
      showToast('Please create or join a room first', 'error', ctx);
      return;
    }
    
    // Helper function to remove dropdown with animation
    const removeDropdownWithAnimation = (dropdownEl: HTMLElement) => {
      dropdownEl.style.animation = 'dropdownSlideOut 0.2s ease-in forwards';
      ctx.setTimeout(() => {
        dropdownEl.remove();
        if (dropdown === dropdownEl) {
          dropdown = null;
        }
      }, 200);
    };
    
    // Show dropdown
    dropdown = createDropdown(rooms, async (room) => {
      if (!ctx.isValid) return;
      
      isLoading = true;
      button.disabled = true;
      setButtonText(button, 'Adding...');
      
      // Extract product data
      const productData = parseProduct(platform);
      
      if (!productData.name) {
        isLoading = false;
        button.disabled = false;
        setButtonText(button, 'Add to VectoCart');
        showToast('Could not extract product information', 'error', ctx);
        return;
      }
      
      // Add product to room
      const success = await addProductToRoom(
        room.id, 
        platform, 
        productData, 
        ctx,
        (message, type) => showToast(message, type, ctx)
      );
      
      isLoading = false;
      button.disabled = false;
      setButtonText(button, 'Add to VectoCart');
      
      if (success) {
        showToast(`Added to "${room.name}"`, 'success', ctx);
      }
    }, removeDropdownWithAnimation);
    
    // Append dropdown to shadow root
    shadowRoot.appendChild(dropdown);
    
    // Close dropdown on outside click (check both shadow root and document)
    const handleOutsideClick = (e: Event) => {
      const target = e.target as Node;
      if (dropdown && !dropdown.contains(target) && !button.contains(target)) {
        // Add closing animation
        dropdown.style.animation = 'dropdownSlideOut 0.2s ease-in forwards';
        ctx.setTimeout(() => {
          dropdown?.remove();
          dropdown = null;
          shadowRoot.removeEventListener('click', handleOutsideClick);
          document.removeEventListener('click', handleOutsideClick);
        }, 200);
      }
    };
    
    ctx.setTimeout(() => {
      // Listen on both shadow root and document for clicks
      shadowRoot.addEventListener('click', handleOutsideClick as EventListener);
      document.addEventListener('click', handleOutsideClick);
    }, 0);
  };
  
  button.addEventListener('click', handleClick);
  
  return button;
}

export default defineContentScript({
  matches: [
    '*://*.amazon.in/*',
    '*://*.flipkart.com/*',
    '*://*.meesho.com/*',
  ],
  cssInjectionMode: 'ui',
  
  async main(ctx) {
    // Wait for DOM to be ready
    const waitForBody = () => {
      return new Promise<void>((resolve) => {
        if (document.body) {
          resolve();
        } else {
          const observer = new MutationObserver(() => {
            if (document.body) {
              observer.disconnect();
              resolve();
            }
          });
          observer.observe(document.documentElement, { childList: true });
        }
      });
    };
    
    await waitForBody();
    
    const hostname = window.location.hostname;
    const platform = detectPlatform(hostname);
    
    if (!platform) {
      logger.debug('Content script: platform not detected', { hostname });
      return;
    }
    
    if (!isProductPage(hostname)) {
      logger.debug('Content script: not a product page', { hostname, pathname: window.location.pathname });
      return;
    }
    
    logger.debug('Content script: initializing', { platform, hostname });
    
    // Create shadow root manually for style isolation
    const shadowHost = document.createElement('div');
    shadowHost.id = 'vectocart-button-host';
    shadowHost.style.position = 'fixed';
    shadowHost.style.bottom = '20px';
    shadowHost.style.left = '20px';
    shadowHost.style.zIndex = '999999';
    shadowHost.style.width = 'auto';
    shadowHost.style.display = 'inline-block';
    
    try {
      document.body.appendChild(shadowHost);
    } catch (err) {
      logger.error('Failed to append shadow host', err);
      return;
    }
    
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    
    // Inject CSS into shadow root
    const style = document.createElement('style');
    style.textContent = `
      .vectocart-button {
        background-color: #E40046;
        color: white;
        border: none;
        border-radius: 16px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        position: relative;
        z-index: 1000001;
        white-space: nowrap;
        min-width: 180px;
      }
      .vectocart-cart-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 16px;
        height: 16px;
      }
      .vectocart-cart-icon svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      .vectocart-button:hover {
        background-color: #CC003F;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      .vectocart-button:active {
        background-color: #B00037;
        transform: scale(0.98);
      }
      .vectocart-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .vectocart-dropdown {
        position: absolute;
        bottom: calc(100% - 6px);
        left: 0;
        right: 0;
        width: 100%;
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 16px 16px 0 0;
        border-bottom: none;
        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
        min-width: 180px;
        max-width: 300px;
        max-height: 300px;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px;
        z-index: 1000000;
        opacity: 0;
        transform: translateY(8px);
        animation: dropdownSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        box-sizing: border-box;
      }
      .vectocart-dropdown::-webkit-scrollbar {
        width: 8px;
      }
      .vectocart-dropdown::-webkit-scrollbar-track {
        background: transparent;
      }
      .vectocart-dropdown::-webkit-scrollbar-thumb {
        background: #E5E7EB;
        border-radius: 4px;
      }
      .vectocart-dropdown::-webkit-scrollbar-thumb:hover {
        background: #D1D5DB;
      }
      @keyframes dropdownSlideIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes dropdownSlideOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(8px);
        }
      }
      .vectocart-dropdown-item {
        padding: 10px 12px;
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.15s ease;
        font-size: 14px;
        font-weight: 400;
        color: #111827;
        margin: 2px 0;
        background: transparent;
        border: none;
        width: 100%;
        text-align: left;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        box-sizing: border-box;
        display: block;
      }
      .vectocart-dropdown-item:hover {
        background-color: #F8F9FA;
      }
      .vectocart-dropdown-item:active {
        background-color: #F0F0F0;
      }
      .vectocart-dropdown-empty {
        padding: 12px;
        text-align: center;
        color: #6B7280;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
    `;
    shadowRoot.appendChild(style);
    
    // Mount button in shadow root
    const button = mountButton(ctx, platform, shadowRoot);
    if (button) {
      shadowRoot.appendChild(button);
      logger.debug('Content script: button mounted', { platform });
    } else {
      logger.error('Content script: failed to create button');
      shadowHost.remove();
      return;
    }
    
    // Store reference for cleanup
    let uiMounted = true;
    
    // Handle SPA navigation
    ctx.addEventListener(window, 'wxt:locationchange', (event: any) => {
      if (!ctx.isValid) return;
      
      const newUrl = event.newUrl instanceof URL ? event.newUrl.href : event.newUrl;
      const url = newUrl instanceof URL ? newUrl : new URL(newUrl);
      const newHostname = url.hostname;
      const newPlatform = detectPlatform(newHostname);
      
      if (newPlatform && isProductPage(newHostname)) {
        // Still on a product page, keep UI mounted
        logger.debug('Content script: SPA navigation to product page', { newUrl: url.href });
      } else {
        // Navigated away from product page, remove UI
        logger.debug('Content script: SPA navigation away from product page', { newUrl: url.href });
        if (uiMounted && shadowHost.parentElement) {
          shadowHost.remove();
          uiMounted = false;
        }
      }
    });
  },
});
