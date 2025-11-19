/**
 * Custom hook for user profile management
 */

import { useEffect, useState } from 'react';
import { getMyProfile, setUsername } from '@/services/supabase/user';
import type { UserProfile } from '@/types/user';
import { logger } from '@/lib/logger';
import { formatSupabaseError } from '@/lib/errors';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    logger.debug('useUserProfile:loadProfile:request');

    try {
      const { data, error: profileError } = await getMyProfile();
      if (profileError) throw profileError;
      setProfile(data);
      logger.debug('useUserProfile:loadProfile:success', { hasProfile: !!data });
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('useUserProfile:loadProfile:error', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateUsername = async (username: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    logger.debug('useUserProfile:updateUsername:request', { username });

    try {
      const { data, error: updateError } = await setUsername(username);
      if (updateError || !data) throw updateError || new Error('Failed to set username');
      // Update profile state immediately - no need to reload
      setProfile(data);
      setLoading(false); // Set loading to false immediately after success
      logger.debug('useUserProfile:updateUsername:success', { profileId: data.id, username: data.username });
      return true;
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('useUserProfile:updateUsername:error', err);
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    hasUsername: !!profile?.username,
    loadProfile,
    updateUsername,
  };
}

