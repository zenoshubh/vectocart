import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signInWithGoogleViaIdentityFlow } from '@/services/supabase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { FcGoogle } from 'react-icons/fc';
import { Loader2, ShoppingCart } from 'lucide-react';

export function AuthForm() {
  const [submitting, setSubmitting] = useState(false);
  const { loading: authLoading } = useAuth();
  const toast = useToast();

  async function handleSignIn() {
    setSubmitting(true);
    try {
      const { error } = await signInWithGoogleViaIdentityFlow();
      if (error) throw error;
      toast.showSuccess('Signed in successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      toast.showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-[#F8F9FA] to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-[#E40046] animate-spin" />
          <p className="text-sm text-[#6B7280]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-[#F8F9FA] to-white p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E40046] to-[#B00037] mb-4 shadow-lg">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">Welcome to VectoCart</h1>
          <p className="text-[#6B7280] text-sm">
            Create shared shopping rooms and decide together with real-time voting
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden">
          <div className="bg-gradient-to-r from-[#E40046] via-[#CC003F] to-[#B00037] px-6 py-8">
            <h2 className="text-white text-xl font-semibold mb-2">Get Started</h2>
            <p className="text-white/90 text-sm">Sign in with your Google account to continue</p>
          </div>
          <div className="p-6">
            <Button
              type="button"
              onClick={handleSignIn}
              className="w-full bg-white text-[#111827] border-2 border-[#E5E7EB] hover:bg-[#F8F9FA] hover:border-[#E40046] transition-all inline-flex items-center justify-center gap-3 h-12 text-base font-medium shadow-sm"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <FcGoogle className="h-5 w-5" aria-hidden />
                  Continue with Google
                </>
              )}
            </Button>
            <p className="mt-4 text-xs text-center text-[#6B7280]">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#6B7280]">
            Create rooms, add products, and vote together in real-time
          </p>
        </div>
      </div>
    </div>
  );
}
