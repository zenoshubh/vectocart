/**
 * Application constants
 */

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes ambiguous chars

export const ROOM_NAME_MIN_LENGTH = 2;
export const ROOM_NAME_MAX_LENGTH = 64;

export const ROOM_CODE_RETRY_ATTEMPTS = 5;

export const VECTOCART_WEBSITE_URL = 'https://vectocart.vercel.app';

export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
} as const;

