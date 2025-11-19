import React, { createContext, useContext, useEffect, useState } from 'react';
import { getMyProfile, setUsername } from '@/services/supabase/user';
import type { UserProfile } from '@/types/user';
import { logger } from '@/lib/logger';
import { formatSupabaseError } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  hasUsername: boolean;
  loadProfile: () => Promise<void>;
  updateUsername: (username: string) => Promise<boolean>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    logger.debug('UserProfileProvider:loadProfile:request');

    try {
      const { data, error: profileError } = await getMyProfile();
      if (profileError) throw profileError;
      setProfile(data);
      logger.debug('UserProfileProvider:loadProfile:success', { hasProfile: !!data });
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('UserProfileProvider:loadProfile:error', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = async (username: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    logger.debug('UserProfileProvider:updateUsername:request', { username });

    try {
      const { data, error: updateError } = await setUsername(username);
      if (updateError || !data) throw updateError || new Error('Failed to set username');
      
      // Update profile state - React will batch this with setLoading(false)
      // This will automatically update hasUsername to true
      setProfile(data);
      setLoading(false);
      
      logger.debug('UserProfileProvider:updateUsername:success', { profileId: data.id, username: data.username });
      return true;
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('UserProfileProvider:updateUsername:error', err);
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  // Load profile when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const value: UserProfileContextType = {
    profile,
    loading,
    error,
    hasUsername: !!profile?.username,
    loadProfile,
    updateUsername,
  };

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfileContext() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfileContext must be used within a UserProfileProvider');
  }
  return context;
}

