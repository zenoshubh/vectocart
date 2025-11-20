/**
 * Toast utilities for content script
 * Displays toast notifications on the host page
 */

import { logger } from '@/lib/logger';

// Type for content script context - use any to avoid type conflicts with WXT's internal types
type ContentScriptContext = any;

/**
 * Injects toast styles into the page if not already injected
 */
function ensureToastStyles(): void {
  const styleId = 'vectocart-toast-styles';
  if (document.getElementById(styleId)) {
    return; // Styles already injected
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .vectocart-error,
    .vectocart-success {
      position: fixed !important;
      top: 20px !important;
      left: 50% !important;
      transform: translateX(-50%) translateY(-20px) !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      padding: 16px !important;
      border-radius: 8px !important;
      background: white !important;
      background-color: white !important;
      color: #111827 !important;
      border: 1px solid #E5E7EB !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
      z-index: 2147483647 !important;
      max-width: 400px !important;
      min-width: 300px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: 400 !important;
      line-height: 1.5 !important;
      opacity: 0 !important;
      animation: vectocartToastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
      word-wrap: break-word !important;
      pointer-events: auto !important;
      visibility: visible !important;
      margin: 0 !important;
    }
    .vectocart-toast-icon {
      flex-shrink: 0 !important;
      width: 16px !important;
      height: 16px !important;
      display: block !important;
    }
    .vectocart-toast-content {
      flex: 1 !important;
      min-width: 0 !important;
      color: #111827 !important;
    }
    .vectocart-error .vectocart-toast-icon {
      color: #EF4444 !important;
    }
    .vectocart-success .vectocart-toast-icon {
      color: #10B981 !important;
    }
    @keyframes vectocartToastSlideIn {
      from {
        opacity: 0 !important;
        transform: translateX(-50%) translateY(-20px) !important;
      }
      to {
        opacity: 1 !important;
        transform: translateX(-50%) translateY(0) !important;
      }
    }
    @keyframes vectocartToastSlideOut {
      from {
        opacity: 1 !important;
        transform: translateX(-50%) translateY(0) !important;
      }
      to {
        opacity: 0 !important;
        transform: translateX(-50%) translateY(-20px) !important;
      }
    }
    .vectocart-toast-removing {
      animation: vectocartToastSlideOut 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
    }
  `;
  
  // Try to inject into head, fallback to body if head doesn't exist
  const target = document.head || document.body;
  if (target) {
    target.appendChild(style);
    logger.debug('ensureToastStyles:injected', { target: target.tagName });
  } else {
    logger.error('ensureToastStyles:noTarget', { hasHead: !!document.head, hasBody: !!document.body });
  }
}

/**
 * Creates an SVG icon for the toast
 */
function createToastIcon(type: 'success' | 'error'): SVGSVGElement {
  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('class', 'vectocart-toast-icon');
  iconSvg.setAttribute('width', '16');
  iconSvg.setAttribute('height', '16');
  iconSvg.setAttribute('viewBox', '0 0 24 24');
  iconSvg.setAttribute('fill', 'none');
  iconSvg.setAttribute('stroke', 'currentColor');
  iconSvg.setAttribute('stroke-width', '2');
  iconSvg.setAttribute('stroke-linecap', 'round');
  iconSvg.setAttribute('stroke-linejoin', 'round');
  
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '10');
  
  if (type === 'success') {
    // CircleCheck icon for success
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'm9 12 2 2 4-4');
    iconSvg.appendChild(circle);
    iconSvg.appendChild(path);
    iconSvg.style.color = '#10B981';
  } else {
    // XCircle icon for error
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'm15 9-6 6');
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'm9 9 6 6');
    iconSvg.appendChild(circle);
    iconSvg.appendChild(path1);
    iconSvg.appendChild(path2);
    iconSvg.style.color = '#EF4444';
  }
  
  return iconSvg;
}

/**
 * Shows a toast notification on the page
 */
export function showToast(message: string, type: 'success' | 'error', ctx: ContentScriptContext): void {
  // Ensure styles are injected
  ensureToastStyles();
  
  // Remove any existing toasts first
  const existingToasts = document.querySelectorAll('.vectocart-success, .vectocart-error');
  existingToasts.forEach((toast) => {
    toast.classList.add('vectocart-toast-removing');
    ctx.setTimeout(() => {
      toast.remove();
    }, 200);
  });
  
  // Ensure body exists
  if (!document.body) {
    logger.error('showToast:document.body not available');
    return;
  }
  
  // Create new toast container
  const toast = document.createElement('div');
  toast.className = type === 'success' ? 'vectocart-success' : 'vectocart-error';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  // Create icon
  const iconSvg = createToastIcon(type);
  
  // Create content container
  const content = document.createElement('span');
  content.className = 'vectocart-toast-content';
  content.textContent = message;
  
  // Assemble toast
  toast.appendChild(iconSvg);
  toast.appendChild(content);
  
  // Set inline styles as backup (in case CSS doesn't load)
  toast.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 16px !important;
    border-radius: 8px !important;
    background: white !important;
    background-color: white !important;
    color: #111827 !important;
    border: 1px solid #E5E7EB !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
    z-index: 2147483647 !important;
    max-width: 400px !important;
    min-width: 300px !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 1.5 !important;
    opacity: 1 !important;
    word-wrap: break-word !important;
    pointer-events: auto !important;
    visibility: visible !important;
    margin: 0 !important;
  `;
  
  // Append to body
  document.body.appendChild(toast);
  
  logger.debug('showToast:created', { 
    message, 
    type, 
    toastElement: toast,
    computedStyle: window.getComputedStyle(toast),
    parentElement: toast.parentElement?.tagName,
    isConnected: toast.isConnected
  });
  
  // Force a reflow to ensure styles are applied
  void toast.offsetHeight;
  
  // Remove toast after delay
  const duration = type === 'success' ? 3000 : 5000;
  ctx.setTimeout(() => {
    toast.classList.add('vectocart-toast-removing');
    ctx.setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 200);
  }, duration);
}

