/**
 * Custom hook for toast notifications
 */

import { toast as sonnerToast } from 'sonner';
import { TOAST_DURATION } from '@/lib/constants';

export function useToast() {
  const showSuccess = (message: string, duration = TOAST_DURATION.MEDIUM) => {
    sonnerToast.success(message, { duration });
  };

  const showError = (message: string, duration = TOAST_DURATION.MEDIUM) => {
    sonnerToast.error(message, { duration });
  };

  const showInfo = (message: string, duration = TOAST_DURATION.SHORT) => {
    sonnerToast.info(message, { duration });
  };

  const showWarning = (message: string, duration = TOAST_DURATION.MEDIUM) => {
    sonnerToast.warning(message, { duration });
  };

  const showLoading = (message: string) => {
    return sonnerToast.loading(message);
  };

  const dismiss = (toastId: string | number) => {
    sonnerToast.dismiss(toastId);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismiss,
  };
}

