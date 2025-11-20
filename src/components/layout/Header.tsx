import { HiOutlineShoppingCart } from 'react-icons/hi2';
import { ArrowLeft, RefreshCw, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfileContext } from '@/contexts/UserProfileContext';
import { useToast } from '@/hooks/useToast';
import { signOut } from '@/services/supabase/auth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function Header({ showBack = false, onBack, onRefresh, refreshing = false }: HeaderProps) {
  const { user } = useAuth();
  const { profile } = useUserProfileContext();
  const toast = useToast();
  const [signingOut, setSigningOut] = useState(false);
  
  // Prioritize username, fallback to email, then 'User'
  const displayName = profile?.username || user?.email || 'User';

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) throw error;
      toast.showSuccess('Signed out successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      toast.showError(errorMessage);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {showBack && onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-md hover:bg-[#F8F9FA] transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-[#6B7280]" />
            </button>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-[#E40046] flex items-center justify-center shrink-0">
              <HiOutlineShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" aria-hidden />
            </div>
            <span className="text-sm sm:text-base font-semibold tracking-tight truncate">VectoCart</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-md hover:bg-[#F8F9FA] transition-colors disabled:opacity-50 shrink-0"
              aria-label="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 sm:h-5 sm:w-5 text-[#6B7280] ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          )}
          {user && (
            <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-[#E5E7EB]">
              <div className="hidden sm:flex items-center gap-2 px-2">
                <div className="h-6 w-6 rounded-full bg-[#E40046] flex items-center justify-center shrink-0">
                  <User className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs text-[#6B7280] max-w-[120px] truncate">
                  {displayName}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2 p-0 text-[#6B7280] hover:text-[#111827] hover:bg-[#F8F9FA] shrink-0"
                aria-label="Sign out"
              >
                {signingOut ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


