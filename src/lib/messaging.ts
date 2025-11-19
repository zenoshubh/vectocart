/**
 * Utilities for messaging with background script
 */

import { browser } from 'wxt/browser';
import type { Message, MessageResponse } from '@/types/messaging';
import { logger } from './logger';
import { toErrorMessage } from './errors';

/**
 * Sends a message to the background script with proper error handling
 */
export async function sendMessage<T = unknown>(
  message: Message,
): Promise<MessageResponse<T>> {
  try {
    logger.debug('sendMessage:request', { type: message.type, payload: message.payload });
    
    const response = await browser.runtime.sendMessage(message) as MessageResponse<T>;
    
    logger.debug('sendMessage:response', { type: message.type, response });
    
    return response;
  } catch (error) {
    logger.error('sendMessage:error', error, { type: message.type });
    
    // If background script is not available, return error response
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error : new Error(toErrorMessage(error)),
    };
  }
}

/**
 * Fallback to direct service call if background script is unavailable
 */
export async function withFallback<T>(
  messageFn: () => Promise<MessageResponse<T>>,
  fallbackFn: () => Promise<{ data: T | null; error: Error | null }>,
): Promise<MessageResponse<T>> {
  try {
    const response = await messageFn();
    if (response.ok) {
      return response;
    }
    // If message failed, try fallback
    logger.debug('Message failed, using fallback');
    const fallback = await fallbackFn();
    return {
      ok: !fallback.error,
      data: fallback.data,
      error: fallback.error,
    };
  } catch (error) {
    // If message sending failed, try fallback
    logger.debug('Message sending failed, using fallback', { error });
    const fallback = await fallbackFn();
    return {
      ok: !fallback.error,
      data: fallback.data,
      error: fallback.error || (error instanceof Error ? error : new Error(toErrorMessage(error))),
    };
  }
}

