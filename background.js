// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  console.log('ClickLink extension installed');
  
  chrome.storage.local.set({
    enabled: false,
    lastUrl: null,
    urlList: []
  });
});

// Handle extension errors
chrome.runtime.onStartup.addListener(() => {
  console.log('ClickLink extension started');
});

// Optional: Add context menu item as an alternative method
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: "capture-image-url",
      title: "Capture Image URL",
      contexts: ["image"],
      visible: false // Hidden by default, can be shown when extension is enabled
    });
  } catch (error) {
    console.error('Error creating context menu:', error);
  }
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "capture-image-url") {
    // Send message to content script to capture the image URL
    chrome.tabs.sendMessage(tab.id, {
      action: "captureImageUrl",
      srcUrl: info.srcUrl
    });
  }
});

// Handle storage changes and update context menu visibility
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.enabled) {
    chrome.contextMenus.update("capture-image-url", {
      visible: changes.enabled.newValue
    }).catch(console.error);
  }
});