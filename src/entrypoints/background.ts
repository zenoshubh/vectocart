export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
  // Open the Side Panel when the extension action icon is clicked
  try {
    // Prefer declarative behavior if supported (Chrome 116+)
    browser.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true });
  } catch (_err) {
    const err = _err instanceof Error ? _err : new Error(String(_err));
    console.warn('[VectoCart] sidePanel.setPanelBehavior failed; using fallback listener.', {
      message: err.message,
      name: err.name,
    });
  }

  // Fallback for browsers where declarative behavior isn't available
  browser.action?.onClicked?.addListener?.((tab) => {
    try {
      if (tab.id != null) browser.sidePanel?.open?.({ tabId: tab.id });
    } catch (_err) {
      const err = _err instanceof Error ? _err : new Error(String(_err));
      console.warn('[VectoCart] sidePanel.open failed on action click.', {
        message: err.message,
        name: err.name,
      });
    }
  });
});
