import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserProfileContext } from '@/contexts/UserProfileContext';
import { useToast } from '@/hooks/useToast';
import { UsernameSchema } from '@/schemas/user';
import { Loader2, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { z } from 'zod';

export function UsernameSetup() {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { updateUsername, loading, hasUsername } = useUserProfileContext();
  const toast = useToast();


  // Debounce username availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      setValidationError(null);
      return;
    }

    const checkTimer = setTimeout(async () => {
      try {
        const parsed = UsernameSchema.safeParse({ username });
        if (!parsed.success) {
          setValidationError(parsed.error.errors[0]?.message || 'Invalid username');
          setIsAvailable(false);
          return;
        }

        setValidationError(null);
        setIsChecking(true);
        // Call the service directly
        const { checkUsernameAvailability } = await import('@/services/supabase/user');
        const result = await checkUsernameAvailability(username.toLowerCase());
        setIsAvailable(result.data === true);
        setIsChecking(false);
      } catch (err) {
        setIsAvailable(false);
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(checkTimer);
  }, [username]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    try {
      const parsed = UsernameSchema.parse({ username });
      const success = await updateUsername(parsed.username);
      if (success) {
        toast.showSuccess('Welcome to VectoCart!');
        // Profile state is updated in the hook, App component will automatically detect hasUsername === true
      } else {
        toast.showError('Failed to set username. Please try again.');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationError(err.errors[0]?.message || 'Invalid username');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set username';
        toast.showError(errorMessage);
      }
    }
  }

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-[#6B7280]" />;
    }
    if (username.length < 3) {
      return null;
    }
    if (validationError || isAvailable === false) {
      return <XCircle className="h-4 w-4 text-[#EF4444]" />;
    }
    if (isAvailable === true) {
      return <CheckCircle2 className="h-4 w-4 text-[#10B981]" />;
    }
    return null;
  };

  const getStatusMessage = () => {
    if (isChecking) {
      return <span className="text-xs text-[#6B7280]">Checking availability...</span>;
    }
    if (validationError) {
      return <span className="text-xs text-[#EF4444]">{validationError}</span>;
    }
    if (username.length > 0 && username.length < 3) {
      return <span className="text-xs text-[#6B7280]">At least 3 characters required</span>;
    }
    if (isAvailable === false) {
      return <span className="text-xs text-[#EF4444]">Username is already taken</span>;
    }
    if (isAvailable === true) {
      return <span className="text-xs text-[#10B981]">Username is available</span>;
    }
    return null;
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-[#F8F9FA] to-white p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E40046] to-[#B00037] mb-4 shadow-lg">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">Choose Your Username</h1>
          <p className="text-[#6B7280] text-sm">
            Pick a unique username to get started with VectoCart
          </p>
        </div>

        <Card className="border border-[#E5E7EB] shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#111827] mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="johndoe"
                    className={`w-full rounded-lg border px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 transition-all ${
                      validationError || isAvailable === false
                        ? 'border-[#EF4444] focus:ring-[#EF4444]'
                        : isAvailable === true
                          ? 'border-[#10B981] focus:ring-[#10B981]'
                          : 'border-[#E5E7EB] focus:ring-[#E40046]'
                    }`}
                    disabled={loading}
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getStatusIcon()}
                  </div>
                </div>
                <div className="mt-2 min-h-[20px]">{getStatusMessage()}</div>
              </div>

              <div className="bg-[#F8F9FA] rounded-lg p-3 border border-[#E5E7EB]">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-[#6B7280] mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-[#6B7280] space-y-1">
                    <p className="font-medium">Username requirements:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>3-20 characters</li>
                      <li>Letters, numbers, and underscores only</li>
                      <li>Cannot start or end with underscore</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !username || isAvailable !== true || !!validationError}
                className="w-full bg-[#E40046] hover:bg-[#CC003F] active:bg-[#B00037] text-white h-12 text-base font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

