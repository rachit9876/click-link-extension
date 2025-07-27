// DOM elements
const elements = {
  toggle: null,
  modeToggle: null,
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
  elements.modeToggle = document.getElementById('mode-toggle');
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
  chrome.storage.local.get(['enabled', 'fileMode', 'urlList'], (data) => {
    if (chrome.runtime.lastError) {
      console.error('ClickLink: Error loading state:', chrome.runtime.lastError);
      return;
    }
    
    elements.toggle.checked = data.enabled || false;
    elements.modeToggle.checked = data.fileMode || false;
    updateUrlCount(data.urlList || []);
    updateExportButton(data.fileMode || false);
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
  // Toggle change handlers
  elements.toggle.addEventListener('change', handleToggleChange);
  elements.modeToggle.addEventListener('change', handleModeToggleChange);
  
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
  console.log('ClickLink: Export button clicked');
  try {
    chrome.storage.local.get(['urlList', 'fileMode'], (data) => {
      console.log('ClickLink: Storage data:', data);
      if (chrome.runtime.lastError) {
        console.error('ClickLink: Error getting URLs for export:', chrome.runtime.lastError);
        alert('Error accessing stored URLs. Please try again.');
        return;
      }
      
      const urlList = data.urlList || [];
      const fileMode = data.fileMode || false;
      
      console.log('ClickLink: URL list:', urlList);
      console.log('ClickLink: File mode:', fileMode);
      
      if (urlList.length === 0) {
        console.log('ClickLink: No URLs to export');
        alert('No URLs to export');
        return;
      }
      
      if (fileMode) {
        console.log('ClickLink: Starting ZIP export');
        exportImagesAsZip(urlList);
      } else {
        console.log('ClickLink: Starting TXT export');
        exportUrlsAsText(urlList);
      }
    });
  } catch (error) {
    console.error('ClickLink: Error exporting:', error);
    alert('Error exporting. Please try again.');
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
    
    // Create text content with only URLs
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const textContent = uniqueUrls.join('\n');
    
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

// Handle mode toggle change
function handleModeToggleChange() {
  const fileMode = elements.modeToggle.checked;
  chrome.storage.local.set({ fileMode });
  updateExportButton(fileMode);
}

// Update export button text based on mode
function updateExportButton(fileMode) {
  elements.exportBtn.textContent = fileMode ? 'Export ZIP' : 'Export TXT';
  elements.exportBtn.title = fileMode ? 'Export images as ZIP file' : 'Export URLs as text file';
}

// Export images as ZIP file
async function exportImagesAsZip(urlList) {
  console.log('ClickLink: exportImagesAsZip called with:', urlList);
  try {
    if (typeof JSZip === 'undefined') {
      console.error('ClickLink: JSZip not loaded');
      alert('ZIP library not loaded. Please refresh and try again.');
      return;
    }
    
    const uniqueUrls = [...new Set(urlList)];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    console.log('ClickLink: Processing', uniqueUrls.length, 'unique URLs');
    
    const zip = new JSZip();
    const promises = [];
    
    uniqueUrls.forEach((url, index) => {
      const filename = `image-${index + 1}.${getFileExtension(url) || 'jpg'}`;
      console.log('ClickLink: Fetching', url, 'as', filename);
      const promise = fetch(url)
        .then(response => {
          console.log('ClickLink: Fetch response for', url, ':', response.status);
          return response.blob();
        })
        .then(blob => {
          console.log('ClickLink: Adding', filename, 'to ZIP');
          zip.file(filename, blob);
        })
        .catch(error => console.error(`ClickLink: Failed to fetch ${url}:`, error));
      promises.push(promise);
    });
    
    console.log('ClickLink: Waiting for all fetches to complete');
    await Promise.all(promises);
    
    console.log('ClickLink: Generating ZIP file');
    const zipBlob = await zip.generateAsync({type: 'blob'});
    const zipUrl = URL.createObjectURL(zipBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = zipUrl;
    downloadLink.download = `clicklink-images-${timestamp}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(zipUrl);
    
    console.log('ClickLink: ZIP export completed');
  } catch (error) {
    console.error('ClickLink: Error in exportImagesAsZip:', error);
    alert('Error creating ZIP file: ' + error.message);
  }
}

// Get file extension from URL
function getFileExtension(url) {
  const match = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
  return match ? match[1] : null;
}

// Handle storage changes
function handleStorageChange(changes, namespace) {
  if (namespace === 'local') {
    if (changes.urlList) {
      updateUrlCount(changes.urlList.newValue || []);
    }
    if (changes.fileMode) {
      updateExportButton(changes.fileMode.newValue || false);
    }
  }
}