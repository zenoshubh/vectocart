import { VECTOCART_WEBSITE_URL } from '@/lib/constants';
import { logger } from '@/lib/logger';

/**
 * Shares a room using Web Share API (text only)
 */
export async function shareRoom(roomName: string, roomCode: string): Promise<void> {
  const shareText = `Join "${roomName}" on VectoCart\n\nRoom Code: ${roomCode}\n\nDownload VectoCart extension: ${VECTOCART_WEBSITE_URL}`;

  // If Web Share API is not available, fallback to clipboard
  if (!navigator.share) {
    try {
      await navigator.clipboard.writeText(shareText);
      logger.debug('shareRoom:clipboard', { roomCode });
      return;
    } catch (err) {
      logger.error('shareRoom:clipboard:error', err);
      throw new Error('Failed to copy to clipboard');
    }
  }

  try {
    // Share text only (no image)
    const shareData: ShareData = {
      title: `Join ${roomName} on VectoCart`,
      text: shareText,
      url: VECTOCART_WEBSITE_URL,
    };

    await navigator.share(shareData);
    logger.debug('shareRoom:success', { roomCode });
  } catch (err) {
    // User cancelled or error occurred
    if (err instanceof Error && err.name !== 'AbortError') {
      logger.error('shareRoom:error', err);
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        logger.debug('shareRoom:clipboard:fallback', { roomCode });
        return;
      } catch (clipboardErr) {
        logger.error('shareRoom:clipboard:fallback:error', clipboardErr);
        throw new Error('Failed to share room');
      }
    } else {
      // User cancelled - this is not an error
      logger.debug('shareRoom:cancelled', { roomCode });
    }
  }
}

