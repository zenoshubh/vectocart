/**
 * Error handling utilities
 */

export interface AppError {
  message: string;
  code?: string;
  originalError?: Error | unknown;
}

/**
 * Converts unknown error types to user-friendly error messages
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    const anyErr = error as Record<string, unknown>;
    if (typeof anyErr.message === 'string') {
      return anyErr.message;
    }
    if (typeof anyErr.error === 'string') {
      return anyErr.error;
    }
    try {
      return JSON.stringify(anyErr);
    } catch {
      return String(anyErr);
    }
  }
  return 'An unexpected error occurred';
}

/**
 * Creates a user-friendly error message from Supabase errors
 */
export function formatSupabaseError(error: unknown): string {
  const message = toErrorMessage(error);
  
  // Map common Supabase error codes to user-friendly messages
  if (message.includes('duplicate key')) {
    return 'This room code already exists. Please try again.';
  }
  if (message.includes('not found') || message.includes('No rows')) {
    return 'Room not found. Please check the room code.';
  }
  if (message.includes('permission denied') || message.includes('RLS')) {
    return 'You do not have permission to perform this action.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  return message;
}

/**
 * Creates an AppError object from an unknown error
 */
export function createAppError(error: unknown, code?: string): AppError {
  return {
    message: toErrorMessage(error),
    code,
    originalError: error instanceof Error ? error : undefined,
  };
}

