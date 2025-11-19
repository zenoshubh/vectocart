/**
 * Application constants
 */

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes ambiguous chars

export const ROOM_NAME_MIN_LENGTH = 2;
export const ROOM_NAME_MAX_LENGTH = 64;

export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;

export const ROOM_CODE_RETRY_ATTEMPTS = 5;

export const VECTOCART_WEBSITE_URL = 'https://vectocart.vercel.app';

export const COLORS = {
  primary: '#E40046',
  primary600: '#CC003F',
  primary700: '#B00037',
  surface: '#FFFFFF',
  surface2: '#F8F9FA',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
  icon: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
} as const;

export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
} as const;

