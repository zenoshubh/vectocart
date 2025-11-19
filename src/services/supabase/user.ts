import { getSupabase } from './client';
import type { UserProfile, ServiceResult } from '@/types/user';
import { logger } from '@/lib/logger';

async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabase();
  logger.debug('getSession:request');
  const { data: sessionData, error } = await supabase.auth.getSession();
  logger.debug('getSession:response', { hasSession: !!sessionData.session, error: error?.message });
  if (error) throw error;
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<ServiceResult<UserProfile>> {
  const supabase = getSupabase();
  try {
    logger.debug('getUserProfile:request', { userId });
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, username, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    logger.debug('getUserProfile:response', { hasProfile: !!data, error: error?.message });

    if (error) {
      // If no profile found, return null data (not an error)
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      throw error;
    }

    if (!data) {
      return { data: null, error: null };
    }

    const profile: UserProfile = {
      id: data.id,
      userId: data.user_id,
      username: data.username,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { data: profile, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('getUserProfile:error', error);
    return { data: null, error };
  }
}

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<ServiceResult<UserProfile>> {
  try {
    const userId = await getCurrentUserId();
    return await getUserProfile(userId);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { data: null, error };
  }
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(username: string): Promise<ServiceResult<boolean>> {
  const supabase = getSupabase();
  try {
    logger.debug('checkUsernameAvailability:request', { username });
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    logger.debug('checkUsernameAvailability:response', { exists: !!data, error: error?.message });

    if (error) throw error;
    return { data: !data, error: null }; // true if available (no data found)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('checkUsernameAvailability:error', error);
    return { data: null, error };
  }
}

/**
 * Create or update user profile with username
 */
export async function setUsername(username: string): Promise<ServiceResult<UserProfile>> {
  const supabase = getSupabase();
  try {
    logger.debug('setUsername:request', { username });
    const userId = await getCurrentUserId();

    // Check if profile already exists
    const existingProfile = await getUserProfile(userId);
    if (existingProfile.error) throw existingProfile.error;

    const usernameLower = username.toLowerCase();

    if (existingProfile.data) {
      // Update existing profile
      logger.debug('updateProfile:request', { userId, username: usernameLower });
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          username: usernameLower,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select('id, user_id, username, created_at, updated_at')
        .single();

      logger.debug('updateProfile:response', { hasData: !!data, error: error?.message });
      if (error) throw error;

      const profile: UserProfile = {
        id: data.id,
        userId: data.user_id,
        username: data.username,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      logger.debug('setUsername:success', { profileId: profile.id });
      return { data: profile, error: null };
    } else {
      // Create new profile
      logger.debug('createProfile:request', { userId, username: usernameLower });
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          username: usernameLower,
        })
        .select('id, user_id, username, created_at, updated_at')
        .single();

      logger.debug('createProfile:response', { hasData: !!data, error: error?.message });
      if (error) throw error;

      const profile: UserProfile = {
        id: data.id,
        userId: data.user_id,
        username: data.username,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      logger.debug('setUsername:success', { profileId: profile.id });
      return { data: profile, error: null };
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('setUsername:error', error);
    return { data: null, error };
  }
}

