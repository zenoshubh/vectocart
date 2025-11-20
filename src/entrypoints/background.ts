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
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message !== 'object') return;
    
    const msg = message as Message;
    logger.debug('onMessage:received', { type: msg.type, payload: msg.payload, senderTabId: sender.tab?.id });
    
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
          case 'products:add': {
            const { addProduct } = await import('@/services/supabase/products');
            const { AddProductSchema } = await import('@/schemas/products');
            const { DuplicateProductError } = await import('@/lib/errors');
            try {
              const validated = AddProductSchema.parse(msg.payload);
              const res = await addProduct(validated.roomId, validated);
              
              // If product was added successfully, notify sidepanel immediately
              if (!res.error && res.data) {
                try {
                  const timestamp = Date.now();
                  await browser.storage.local.set({
                    'vectocart:lastProductAdded': timestamp,
                    'vectocart:lastProductRoomId': validated.roomId,
                  });
                  logger.debug('background:productAdded:storageSet', { 
                    roomId: validated.roomId, 
                    timestamp 
                  });
                } catch (storageErr) {
                  logger.error('background:productAdded:storageError', storageErr);
                  // Don't fail the request if storage update fails
                }
              }
              
              // Preserve error information when serializing (errors lose class properties when sent through messages)
              let serializedError: Error | null = null;
              if (res.error) {
                if (res.error instanceof DuplicateProductError) {
                  // Create a new Error with the message and add code property
                  serializedError = new Error(res.error.message);
                  (serializedError as any).code = 'DUPLICATE_PRODUCT';
                  (serializedError as any).name = 'DuplicateProductError';
                } else {
                  serializedError = res.error instanceof Error ? res.error : new Error(String(res.error));
                }
                logger.debug('background:productAdd:error', { 
                  errorMessage: serializedError.message,
                  errorCode: (serializedError as any).code 
                });
              }
              
              respond({ ok: !res.error, data: res.data, error: serializedError });
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              respond({ ok: false, data: null, error });
            }
            return;
          }
          case 'products:list': {
            const { listProductsByRoom } = await import('@/services/supabase/products');
            const { ListProductsSchema } = await import('@/schemas/products');
            try {
              const validated = ListProductsSchema.parse(msg.payload);
              const res = await listProductsByRoom(validated.roomId);
              respond({ ok: !res.error, data: res.data, error: res.error });
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              respond({ ok: false, data: null, error });
            }
            return;
          }
          case 'products:delete': {
            const { deleteProduct } = await import('@/services/supabase/products');
            const { DeleteProductSchema } = await import('@/schemas/products');
            try {
              const validated = DeleteProductSchema.parse(msg.payload);
              const res = await deleteProduct(validated.productId);
              respond({ ok: !res.error, data: res.data, error: res.error });
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              respond({ ok: false, data: null, error });
            }
            return;
          }
          case 'votes:vote': {
            const { voteProduct } = await import('@/services/supabase/votes');
            const { VoteProductSchema } = await import('@/schemas/votes');
            try {
              const validated = VoteProductSchema.parse(msg.payload);
              const res = await voteProduct(validated);
              respond({ ok: !res.error, data: res.data, error: res.error });
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              respond({ ok: false, data: null, error });
            }
            return;
          }
          case 'votes:remove': {
            const { removeVote } = await import('@/services/supabase/votes');
            const { RemoveVoteSchema } = await import('@/schemas/votes');
            try {
              const validated = RemoveVoteSchema.parse(msg.payload);
              const res = await removeVote(validated);
              respond({ ok: !res.error, data: res.data, error: res.error });
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              respond({ ok: false, data: null, error });
            }
            return;
          }
          case 'auth:check': {
            const { getSupabase } = await import('@/services/supabase/client');
            try {
              const supabase = getSupabase();
              const { data: sessionData, error } = await supabase.auth.getSession();
              if (error) throw error;
              const isAuthenticated = !!sessionData.session;
              const userId = sessionData.session?.user?.id ?? null;
              respond({
                ok: true,
                data: { isAuthenticated, userId },
                error: null,
              });
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              respond({ ok: false, data: null, error });
            }
            return;
          }
          case 'sidepanel:open': {
            try {
              logger.debug('sidepanel:open:request', { 
                hasSender: !!sender, 
                hasTab: !!sender?.tab, 
                tabId: sender?.tab?.id,
                senderUrl: sender?.url,
              });
              
              let tabId: number | undefined;
              
              // Try to get tab ID from sender first
              if (sender?.tab?.id) {
                tabId = sender.tab.id;
                logger.debug('sidepanel:open:usingSenderTabId', { tabId });
              } else {
                // Fallback: get the active tab in the current window
                logger.debug('sidepanel:open:queryingActiveTab');
                const tabs = await browser.tabs.query({ active: true, currentWindow: true });
                logger.debug('sidepanel:open:activeTabs', { count: tabs.length });
                
                if (tabs[0]?.id) {
                  tabId = tabs[0].id;
                  logger.debug('sidepanel:open:usingActiveTab', { tabId });
                } else if (sender?.url) {
                  // Last resort: try to find tab by URL
                  logger.debug('sidepanel:open:queryingByUrl', { url: sender.url });
                  const urlTabs = await browser.tabs.query({ url: sender.url });
                  if (urlTabs[0]?.id) {
                    tabId = urlTabs[0].id;
                    logger.debug('sidepanel:open:usingUrlMatch', { tabId });
                  }
                }
              }
              
              if (!tabId) {
                throw new Error('No tab found to open sidepanel');
              }
              
              // Open the sidepanel
              await browser.sidePanel.open({ tabId });
              logger.info('sidepanel:open:success', { tabId });
              respond({ ok: true, data: null, error: null });
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              logger.error('sidepanel:open:error', error, { 
                senderTabId: sender?.tab?.id,
                senderUrl: sender?.url 
              });
              respond({ ok: false, data: null, error });
            }
            return;
          }
          default: {
            const _exhaustive: never = msg;
            logger.warn('onMessage:unhandled', { type: (msg as Message).type });
            return;
          }
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
