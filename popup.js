// DOM elements
const elements = {
  toggle: null,
  storedUrlElement: null,
  clearBtn: null,
  exportBtn: null,
  dedupeBtn: null,
  debugBtn: null,
  testBtn: null
};

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  try {
    initializeElements();
    loadInitialState();
    setupEventListeners();
  } catch (error) {
    console.error('ClickLink: Error initializing popup:', error);
  }
});

// Initialize DOM elements
function initializeElements() {
  elements.toggle = document.getElementById('feature-toggle');
  elements.storedUrlElement = document.getElementById('stored-url');
  elements.clearBtn = document.getElementById('clear-btn');
  elements.exportBtn = document.getElementById('export-btn');
  elements.dedupeBtn = document.getElementById('dedupe-btn');
  elements.debugBtn = document.getElementById('debug-btn');
  elements.testBtn = document.getElementById('test-btn');
  
  // Verify all elements exist
  const missingElements = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([name]) => name);
  
  if (missingElements.length > 0) {
    throw new Error(`Missing elements: ${missingElements.join(', ')}`);
  }
}

// Load saved state from storage
function loadInitialState() {
  chrome.storage.local.get(['enabled', 'urlList'], (data) => {
    if (chrome.runtime.lastError) {
      console.error('ClickLink: Error loading state:', chrome.runtime.lastError);
      return;
    }
    
    elements.toggle.checked = data.enabled || false;
    updateUrlCount(data.urlList || []);
  });
}

// Update URL count display and button states
function updateUrlCount(urlList) {
  const count = urlList.length;
  const uniqueCount = new Set(urlList).size;
  
  // Show both total and unique counts
  if (count !== uniqueCount) {
    elements.storedUrlElement.textContent = `${count} (${uniqueCount} unique)`;
  } else {
    elements.storedUrlElement.textContent = count;
  }
  
  // Update button states
  elements.clearBtn.disabled = count === 0;
  elements.exportBtn.disabled = count === 0;
  elements.dedupeBtn.disabled = count === 0 || count === uniqueCount;
}

// Setup event listeners
function setupEventListeners() {
  // Toggle change handler
  elements.toggle.addEventListener('change', handleToggleChange);
  
  // Button handlers
  elements.clearBtn.addEventListener('click', handleClearClick);
  elements.exportBtn.addEventListener('click', handleExportClick);
  elements.dedupeBtn.addEventListener('click', handleDedupeClick);
  elements.debugBtn.addEventListener('click', handleDebugClick);
  elements.testBtn.addEventListener('click', handleTestClick);
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener(handleStorageChange);
}

// Handle toggle state change
function handleToggleChange() {
  const isEnabled = elements.toggle.checked;
  
  try {
    chrome.storage.local.set({ enabled: isEnabled });
    
    // Send message to content script about the state change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "toggleStateChanged",
          enabled: isEnabled
        }).catch((error) => {
          // Silently handle errors for inactive tabs
          console.debug('ClickLink: Could not send message to content script:', error);
        });
      }
    });
  } catch (error) {
    console.error('ClickLink: Error handling toggle change:', error);
  }
}

// Handle clear button click
function handleClearClick() {
  if (confirm('Are you sure you want to clear all captured URLs?')) {
    try {
      chrome.storage.local.set({ lastUrl: null, urlList: [] });
      updateUrlCount([]);
    } catch (error) {
      console.error('ClickLink: Error clearing URLs:', error);
      alert('Error clearing URLs. Please try again.');
    }
  }
}

// Handle export button click
function handleExportClick() {
  try {
    chrome.storage.local.get(['urlList'], (data) => {
      if (chrome.runtime.lastError) {
        console.error('ClickLink: Error getting URLs for export:', chrome.runtime.lastError);
        alert('Error accessing stored URLs. Please try again.');
        return;
      }
      
      const urlList = data.urlList || [];
      console.log('ClickLink: URLs to export:', urlList);
      console.log('ClickLink: Total URLs for export:', urlList.length);
      
      if (urlList.length === 0) {
        alert('No URLs to export');
        return;
      }
      
      exportUrlsAsText(urlList);
    });
  } catch (error) {
    console.error('ClickLink: Error exporting URLs:', error);
    alert('Error exporting URLs. Please try again.');
  }
}

// Handle dedupe button click
function handleDedupeClick() {
  try {
    chrome.storage.local.get(['urlList'], (data) => {
      if (chrome.runtime.lastError) {
        console.error('ClickLink: Error getting URLs for deduplication:', chrome.runtime.lastError);
        alert('Error accessing stored URLs. Please try again.');
        return;
      }
      
      const urlList = data.urlList || [];
      const uniqueUrls = [...new Set(urlList)];
      
      if (urlList.length === uniqueUrls.length) {
        alert('No duplicates found!');
        return;
      }
      
      const duplicatesCount = urlList.length - uniqueUrls.length;
      
      if (confirm(`Remove ${duplicatesCount} duplicate URLs?`)) {
        chrome.storage.local.set({ urlList: uniqueUrls }, () => {
          console.log('ClickLink: Duplicates removed, unique URLs remaining:', uniqueUrls.length);
        });
      }
    });
  } catch (error) {
    console.error('ClickLink: Error removing duplicates:', error);
    alert('Error removing duplicates. Please try again.');
  }
}

// Handle debug button click
function handleDebugClick() {
  try {
    chrome.storage.local.get(null, (data) => {
      console.log('=== ClickLink Debug Info ===');
      console.log('All stored data:', data);
      console.log('Extension enabled:', data.enabled);
      console.log('Last URL:', data.lastUrl);
      console.log('URL List:', data.urlList);
      console.log('URL List length:', (data.urlList || []).length);
      console.log('Unique URLs:', [...new Set(data.urlList || [])]);
      console.log('=== End Debug Info ===');
      
      alert(`Debug info logged to console. URLs stored: ${(data.urlList || []).length}`);
    });
  } catch (error) {
    console.error('ClickLink: Error getting debug info:', error);
    alert('Error getting debug info. Please try again.');
  }
}

// Handle test button click - adds test URLs for debugging
function handleTestClick() {
  try {
    const testUrls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.png',
      'https://example.com/image3.gif'
    ];
    
    chrome.storage.local.get(['urlList'], (data) => {
      const urlList = data.urlList || [];
      const updatedList = [...urlList, ...testUrls];
      
      chrome.storage.local.set({ 
        urlList: updatedList,
        lastUrl: testUrls[testUrls.length - 1]
      }, () => {
        console.log('ClickLink: Test URLs added:', testUrls);
        console.log('ClickLink: Updated URL list:', updatedList);
        alert(`Added ${testUrls.length} test URLs. Total: ${updatedList.length}`);
      });
    });
  } catch (error) {
    console.error('ClickLink: Error adding test URLs:', error);
    alert('Error adding test URLs. Please try again.');
  }
}

// Export URLs as text file
function exportUrlsAsText(urlList) {
  try {
    console.log('ClickLink: Starting export with URLs:', urlList);
    
    // Remove duplicates for export while preserving capture order
    const uniqueUrls = [...new Set(urlList)];
    console.log('ClickLink: Unique URLs for export:', uniqueUrls);
    console.log('ClickLink: Original count:', urlList.length, 'Unique count:', uniqueUrls.length);
    
    // Create text content with metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const header = `# ClickLink Export - ${new Date().toLocaleString()}\n# Total URLs: ${uniqueUrls.length} (${urlList.length} total captures)\n\n`;
    const textContent = header + uniqueUrls.join('\n');
    
    console.log('ClickLink: Export content:', textContent);
    
    // Create and download file
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `clicklink-urls-${timestamp}.txt`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    console.log('ClickLink: Export file download triggered');
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    console.error('ClickLink: Error creating export file:', error);
    alert('Error creating export file. Please try again.');
  }
}

// Handle storage changes
function handleStorageChange(changes, namespace) {
  if (namespace === 'local' && changes.urlList) {
    updateUrlCount(changes.urlList.newValue || []);
  }
}