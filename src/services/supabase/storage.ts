/**
 * Custom storage adapter for Supabase that uses browser.storage (WXT API)
 * This allows the session to be shared between sidepanel and background script
 */

import { browser } from 'wxt/browser';
import { logger } from '@/lib/logger';

async function getBrowserStorageAsync() {
  // Use WXT's browser API (works in all contexts)
  if (browser?.storage?.local) {
    return browser.storage.local;
  }
  
  logger.debug('[VectoCart] browser.storage.local not available, will use localStorage fallback');
  return null;
}

export function createBrowserStorageAdapter() {
  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        const storage = await getBrowserStorageAsync();
        
        if (storage) {
          const result = await storage.get([key]);
          const value = result[key] || null;
          logger.debug('[VectoCart] Storage getItem', { key, hasValue: !!value, storageType: 'browser.storage' });
          return value;
        }
        
        // Fallback to localStorage if browser.storage is not available (e.g., in sidepanel)
        if (typeof localStorage !== 'undefined') {
          const value = localStorage.getItem(key);
          logger.debug('[VectoCart] Storage getItem', { key, hasValue: !!value, storageType: 'localStorage' });
          return value;
        }
        logger.debug('[VectoCart] Storage getItem', { key, hasValue: false, storageType: 'none' });
        return null;
      } catch (err) {
        logger.error('[VectoCart] Storage getItem error', err, { key });
        // Fallback to localStorage
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        const storage = await getBrowserStorageAsync();
        
        if (storage) {
          await storage.set({ [key]: value });
          logger.debug('[VectoCart] Storage setItem', { key, storageType: 'browser.storage' });
          return;
        }
        
        // Fallback to localStorage if browser.storage is not available
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
          logger.debug('[VectoCart] Storage setItem', { key, storageType: 'localStorage' });
        }
      } catch (err) {
        logger.error('[VectoCart] Storage setItem error', err, { key });
        // Fallback to localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        const storage = await getBrowserStorageAsync();
        
        if (storage) {
          await storage.remove([key]);
          logger.debug('[VectoCart] Storage removeItem', { key, storageType: 'browser.storage' });
          return;
        }
        
        // Fallback to localStorage if browser.storage is not available
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
          logger.debug('[VectoCart] Storage removeItem', { key, storageType: 'localStorage' });
        }
      } catch (err) {
        logger.error('[VectoCart] Storage removeItem error', err, { key });
        // Fallback to localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      }
    },
  };
}

