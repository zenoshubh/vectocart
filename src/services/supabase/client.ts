import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createBrowserStorageAdapter } from './storage';

let client: SupabaseClient | null = null;

interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  WXT_SUPABASE_URL?: string;
  WXT_SUPABASE_ANON_KEY?: string;
}

export function getSupabase(): SupabaseClient {
  if (client) return client;
  
  // Clear any existing client to ensure fresh session check
  client = null;
  // Prefer standard Vite env prefix, fall back to WXT_* for compatibility
  const env = (import.meta as { env?: Env }).env ?? {};
  const url =
    env.VITE_SUPABASE_URL ||
    env.WXT_SUPABASE_URL;
  const anonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.WXT_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Surface which keys are missing to help local dev
    const present = {
      VITE_SUPABASE_URL: !!env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!env.VITE_SUPABASE_ANON_KEY,
      WXT_SUPABASE_URL: !!env.WXT_SUPABASE_URL,
      WXT_SUPABASE_ANON_KEY: !!env.WXT_SUPABASE_ANON_KEY,
    };
    throw new Error(
      `[VectoCart] Supabase env missing. Expected VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY (preferred) or WXT_SUPABASE_URL/WXT_SUPABASE_ANON_KEY. Present: ${JSON.stringify(
        present,
      )}`,
    );
  }
  // Lazy import logger to avoid circular dependencies
  import('@/lib/logger').then(({ logger }) => {
    logger.debug('createClient', {
      urlPreview: url.slice(0, 24) + '...',
      anonKeyPresent: !!anonKey,
    });
  }).catch(() => {
    // Silently fail if logger not available
  });
  // Use custom storage adapter for browser extension compatibility
  const storageAdapter = createBrowserStorageAdapter();
  
  // Extract project ref from URL for proper storage key
  // Supabase URL format: https://<project-ref>.supabase.co
  const urlMatch = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  const projectRef = urlMatch ? urlMatch[1] : 'default';
  const storageKey = `sb-${projectRef}-auth-token`;
  
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable URL detection in extension context
      storage: storageAdapter,
      storageKey: storageKey,
    },
    global: {
      headers: {
        apikey: anonKey,
        // Don't set Authorization header statically - let Supabase set it
        // dynamically based on the session token
      },
    },
  });
  
  // Log storage adapter setup
  import('@/lib/logger').then(({ logger }) => {
    logger.debug('Supabase client created', { 
      storageKey,
      hasStorageAdapter: !!storageAdapter 
    });
  }).catch(() => {});
  
  return client;
}

/**
 * Reset the Supabase client (useful after sign-in/sign-out)
 */
export function resetSupabaseClient(): void {
  client = null;
}

export function debugSupabaseEnv(): {
  urlPreview: string | null;
  anonKeyPresent: boolean;
  source: 'VITE' | 'WXT' | 'none';
  raw: Record<string, unknown>;
} {
  const env = (import.meta as { env?: Env }).env ?? {};
  const viteUrl = env.VITE_SUPABASE_URL;
  const wxtUrl = env.WXT_SUPABASE_URL;
  const viteKey = env.VITE_SUPABASE_ANON_KEY;
  const wxtKey = env.WXT_SUPABASE_ANON_KEY;
  const pickedUrl = viteUrl || wxtUrl || null;
  const pickedKey = viteKey || wxtKey || null;
  const source: 'VITE' | 'WXT' | 'none' = pickedUrl
    ? viteUrl
      ? 'VITE'
      : 'WXT'
    : 'none';
  const out = {
    urlPreview: pickedUrl ? pickedUrl.slice(0, 32) + '...' : null,
    anonKeyPresent: !!pickedKey,
    source,
    raw: {
      hasVITE_URL: !!viteUrl,
      hasVITE_KEY: !!viteKey,
      hasWXT_URL: !!wxtUrl,
      hasWXT_KEY: !!wxtKey,
    },
  };
  // Lazy import logger
  import('@/lib/logger').then(({ logger }) => {
    logger.info('debugEnv', out);
  }).catch(() => {});
  return out;
}


