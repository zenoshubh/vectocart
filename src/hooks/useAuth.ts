/**
 * Custom hook for authentication state management
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from '@/services/supabase/auth';
import { logger } from '@/lib/logger';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    logger.debug('useAuth:initializing');
    
    try {
      const unsubscribe = onAuthStateChanged((u) => {
        logger.debug('useAuth:stateChanged', { userId: u?.id, email: u?.email });
        setUser(u);
        setLoading(false);
        setError(null);
      });

      return () => {
        logger.debug('useAuth:cleanup');
        unsubscribe();
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('useAuth:error', error);
      setError(error);
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
  };
}

