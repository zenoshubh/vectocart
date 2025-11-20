import type { User } from '@supabase/supabase-js';
import type { ServiceResult } from '@/types/rooms';
import { getSupabase } from './client';
import { browser } from 'wxt/browser';

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  const supabase = getSupabase();
  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => {
    subscription.subscription.unsubscribe();
  };
}

export async function signInWithGoogleViaIdentityFlow(): Promise<ServiceResult<User>> {
  try {
    // Use WXT's browser API
    if (!browser.runtime || !browser.identity) {
      throw new Error('Identity API is unavailable in this context.');
    }
    
    const manifest = browser.runtime.getManifest();
    const clientId = (manifest as any)?.oauth2?.client_id as string | undefined;
    const scopes = ((manifest as any)?.oauth2?.scopes as string[] | undefined) ?? [
      'openid',
      'email',
      'profile',
    ];
    if (!clientId) {
      throw new Error('Missing oauth2.client_id in manifest.');
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('redirect_uri', `https://${browser.runtime.id}.chromiumapp.org`);
    authUrl.searchParams.set('scope', scopes.join(' '));

    // launchWebAuthFlow uses callbacks, so we need to check lastError in the callback
    // WXT's browser API handles this correctly
    const redirectedTo: string = await new Promise((resolve, reject) => {
      browser.identity.launchWebAuthFlow(
        { url: authUrl.href, interactive: true },
        (responseUrl: string | undefined) => {
          // Check lastError (WXT's browser API provides this)
          const lastErr = browser.runtime.lastError;
          if (lastErr) return reject(new Error(lastErr.message));
          if (!responseUrl) return reject(new Error('Empty response from auth flow'));
          resolve(responseUrl);
        },
      );
    });

    const url = new URL(redirectedTo);
    const params = new URLSearchParams(url.hash.replace('#', ''));
    const idToken = params.get('id_token');
    if (!idToken) throw new Error('No id_token in redirect URL.');

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
    return { data: data.user, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { data: null, error };
  }
}

export async function signOut(): Promise<ServiceResult<null>> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { data: null, error };
  }
}


