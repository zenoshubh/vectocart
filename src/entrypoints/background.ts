import type { Message, MessageResponse } from '@/types/messaging';
import { logger } from '@/lib/logger';

export default defineBackground(() => {
  logger.info('Background script initialized', { id: browser.runtime.id });
  
  // Open the Side Panel when the extension action icon is clicked
  try {
    // Prefer declarative behavior if supported (Chrome 116+)
    browser.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });
  } catch (err) {
    logger.warn('sidePanel.setPanelBehavior failed; using fallback listener', { error: err });
  }

  // Fallback for browsers where declarative behavior isn't available
  browser.action?.onClicked?.addListener?.((tab) => {
    try {
      if (tab.id != null) browser.sidePanel?.open?.({ tabId: tab.id });
    } catch (err) {
      logger.warn('sidePanel.open failed on action click', { error: err });
    }
  });

  // Messaging: rooms operations
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== 'object') return;
    
    const msg = message as Message;
    logger.debug('onMessage:received', { type: msg.type, payload: msg.payload });
    
    const respond = (res: MessageResponse) => {
      try {
        logger.debug('onMessage:respond', { type: msg.type, ok: res.ok });
        sendResponse(res);
      } catch (err) {
        logger.error('sendResponse failed', err);
      }
    };

    (async () => {
      try {
        switch (msg.type) {
          case 'vc:ping': {
            respond({ ok: true, data: null, error: null });
            return;
          }
          case 'rooms:create': {
            const { createRoom } = await import('@/services/supabase/rooms');
            const res = await createRoom(msg.payload.name);
            respond({ ok: !res.error, data: res.data, error: res.error });
            return;
          }
          case 'rooms:join': {
            const { joinRoomByCode } = await import('@/services/supabase/rooms');
            const res = await joinRoomByCode(msg.payload.code);
            respond({ ok: !res.error, data: res.data, error: res.error });
            return;
          }
          case 'rooms:list': {
            const { listMyRooms } = await import('@/services/supabase/rooms');
            const res = await listMyRooms();
            respond({ ok: !res.error, data: res.data, error: res.error });
            return;
          }
          case 'rooms:delete': {
            const { deleteRoom } = await import('@/services/supabase/rooms');
            const res = await deleteRoom(msg.payload.roomId);
            respond({ ok: !res.error, data: res.data, error: res.error });
            return;
          }
          case 'rooms:removeMember': {
            const { removeMember } = await import('@/services/supabase/rooms');
            const res = await removeMember(msg.payload.roomId, msg.payload.userId);
            respond({ ok: !res.error, data: res.data, error: res.error });
            return;
          }
          default:
            logger.warn('onMessage:unhandled', { type: msg.type });
            return;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('onMessage:handlerError', error, { type: msg.type });
        respond({
          ok: false,
          data: null,
          error,
        });
      }
    })();

    // Keep the message channel open for async response
    return true;
  });
});
