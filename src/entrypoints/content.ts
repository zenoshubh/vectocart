import { logger } from '@/lib/logger';

export default defineContentScript({
  matches: ['*://*.google.com/*'],
  main() {
    logger.debug('Content script loaded');
    // TODO: Implement e-commerce site detection and "Add to VectoCart" button injection
  },
});
