/**
 * API utilities for content script
 */

import { sendMessage } from '@/lib/messaging';
import { logger } from '@/lib/logger';
import { isDuplicateProductError } from '@/lib/errors';
import type { Room } from '@/types/rooms';
import type { ProductPlatform } from '@/types/products';
import type { ReturnType } from '@/lib/parsers';

// Type for content script context - use any to avoid type conflicts with WXT's internal types
type ContentScriptContext = any;

/**
 * Checks if the user is authenticated
 */
export async function checkAuth(ctx: ContentScriptContext): Promise<{ isAuthenticated: boolean; userId: string | null }> {
  try {
    const response = await sendMessage({ type: 'auth:check', payload: {} });
    if (response.ok && response.data) {
      return response.data as { isAuthenticated: boolean; userId: string | null };
    }
    return { isAuthenticated: false, userId: null };
  } catch (err) {
    logger.error('checkAuth:error', err);
    return { isAuthenticated: false, userId: null };
  }
}

/**
 * Fetches the user's rooms
 */
export async function fetchRooms(ctx: ContentScriptContext): Promise<Room[]> {
  try {
    const response = await sendMessage({ type: 'rooms:list', payload: {} });
    if (response.ok && response.data) {
      return response.data as Room[];
    }
    return [];
  } catch (err) {
    logger.error('fetchRooms:error', err);
    return [];
  }
}

/**
 * Opens the sidepanel
 */
export async function openSidepanel(ctx: ContentScriptContext, showToastFn?: (message: string, type: 'success' | 'error') => void): Promise<void> {
  try {
    // Content scripts can't access tabs API, must use background script
    const response = await sendMessage({ type: 'sidepanel:open', payload: {} });
    logger.debug('openSidepanel:response', { ok: response.ok, error: response.error });
    
    if (!response.ok || response.error) {
      logger.error('openSidepanel:failed', response.error);
      if (showToastFn) {
        showToastFn('Failed to open sidepanel. Please click the extension icon.', 'error');
      }
    } else {
      logger.debug('openSidepanel:success');
    }
  } catch (err) {
    logger.error('openSidepanel:error', err);
    if (showToastFn) {
      showToastFn('Failed to open sidepanel. Please click the extension icon.', 'error');
    }
  }
}

/**
 * Adds a product to a room
 * Returns true if successful, false otherwise
 * Handles duplicate product errors and shows appropriate toasts
 */
export async function addProductToRoom(
  roomId: string,
  platform: ProductPlatform,
  productData: ReturnType<typeof import('@/lib/parsers').parseProduct>,
  ctx: ContentScriptContext,
  showToastFn: (message: string, type: 'success' | 'error') => void,
): Promise<boolean> {
  try {
    const response = await sendMessage({
      type: 'products:add',
      payload: {
        roomId,
        name: productData.name ?? 'Unknown Product',
        price: productData.price,
        currency: productData.currency,
        rating: productData.rating,
        image: productData.image,
        url: window.location.href,
        platform,
      },
    });
    
    if (response.ok && !response.error) {
      return true;
    }
    
    // Check if it's a duplicate product error
    if (response.error) {
      // Extract error message from serialized error
      let errorMessage = '';
      let errorCode = '';
      
      if (response.error instanceof Error) {
        errorMessage = response.error.message;
        errorCode = (response.error as any).code || '';
      } else if (response.error && typeof response.error === 'object') {
        const err = response.error as Record<string, unknown>;
        errorMessage = String(err.message || '');
        errorCode = String(err.code || '');
      } else {
        errorMessage = String(response.error);
      }
      
      logger.debug('addProductToRoom:responseError', { 
        errorMessage,
        errorCode,
        isDuplicate: isDuplicateProductError(response.error) || 
                     errorCode === 'DUPLICATE_PRODUCT' ||
                     errorMessage.includes('already in the room')
      });
      
      // Check for duplicate using multiple methods (handles serialized errors)
      const isDuplicate = isDuplicateProductError(response.error) || 
                          errorCode === 'DUPLICATE_PRODUCT' ||
                          errorMessage.includes('already in the room') ||
                          errorMessage.includes('duplicate product');
      
      if (isDuplicate) {
        logger.debug('addProductToRoom:showingDuplicateToast');
        showToastFn('This product is already in the room', 'error');
        return false;
      }
    }
    
    throw response.error || new Error('Failed to add product');
  } catch (err) {
    logger.error('addProductToRoom:error', err);
    
    // Check if it's a duplicate product error
    if (isDuplicateProductError(err)) {
      showToastFn('This product is already in the room', 'error');
      return false;
    }
    
    showToastFn('Failed to add product', 'error');
    return false;
  }
}

