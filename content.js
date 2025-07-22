let isEnabled = false;
let isAltKeyPressed = false;

// Constants for better maintainability
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|svg)/i;
const BASE64_PREFIX = 'data:';

// High-quality image attributes in order of preference
const HIGH_QUALITY_ATTRIBUTES = [
  'data-src-original',
  'data-original',
  'data-high-res-src',
  'data-full-size',
  'data-large-file',
  'data-original-src',
  'data-zoom-image',
  'data-full',
  'data-hd-src',
  'data-super-res',
  'data-image-hd',
  'data-high-res-img',
  'data-zoom-src',
  'data-big',
  'data-full-img',
  'data-1000px',
  'data-raw-src',
  'data-src'
];

// Utility functions
const isBase64Image = (url) => url && url.startsWith(BASE64_PREFIX);
const isImageUrl = (url) => url && IMAGE_EXTENSIONS.test(url);

// Initialize extension state
chrome.storage.local.get(['enabled'], (data) => {
  isEnabled = data.enabled || false;
});

// Track Alt key state with improved handling
document.addEventListener('keydown', (e) => {
  if (e.key === 'Alt') {
    isAltKeyPressed = true;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Alt') {
    isAltKeyPressed = false;
  }
});

// Handle focus events to reset Alt key state
document.addEventListener('blur', () => {
  isAltKeyPressed = false;
});

window.addEventListener('blur', () => {
  isAltKeyPressed = false;
});

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case "toggleStateChanged":
        isEnabled = request.enabled;
        break;
      case "captureImageUrl":
        if (request.srcUrl) {
          storeImageUrl(request.srcUrl);
        }
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Function to extract URLs from srcset
function extractBestUrlFromSrcset(srcset) {
  if (!srcset) return null;
  
  const urls = srcset.split(',').map(item => {
    const parts = item.trim().split(' ');
    return {
      url: parts[0],
      descriptor: parts[1] || '1x'
    };
  });
  
  // Sort by resolution (prefer higher resolutions)
  urls.sort((a, b) => {
    const aRes = parseFloat(a.descriptor) || 1;
    const bRes = parseFloat(b.descriptor) || 1;
    return bRes - aRes;
  });
  
  return urls[0]?.url;
}

// Function to clean up thumbnail URLs
function cleanThumbnailUrl(url) {
  if (!url) return url;
  
  return url
    .replace(/\/thumb\/|\/thumbnails\/|\/small\/|\/preview\/|\/display_\d+\/|\/resize\/[^/]+\//gi, '/')
    .replace(/-\d+x\d+\./g, '.')
    .replace(/[_-](?:small|medium|thumb|tiny|preview)\./gi, '.');
}

// Function to search for image URLs in page content
function findImageUrlInPageContent() {
  // Check URL parameters for image URLs
  const urlParams = new URLSearchParams(window.location.search);
  for (const [, value] of urlParams.entries()) {
    if (isImageUrl(value) && !isBase64Image(value)) {
      return value;
    }
  }
  
  // Look for links that might contain the full image
  const imageLinks = document.querySelectorAll('a[href]');
  for (const link of imageLinks) {
    if (isImageUrl(link.href) && !isBase64Image(link.href) && link.querySelector('img')) {
      return link.href;
    }
  }
  
  return null;
}

// Main function to get the highest quality image URL
function getHighestQualityImageUrl(img) {
  try {
    // If the image is in a picture element, check for source elements
    const pictureParent = img.closest('picture');
    if (pictureParent) {
      const sources = pictureParent.querySelectorAll('source');
      for (const source of sources) {
        if (source.srcset) {
          const highestRes = extractBestUrlFromSrcset(source.srcset);
          if (highestRes && !isBase64Image(highestRes)) {
            return highestRes;
          }
        }
      }
    }
    
    // If parent is a link, it might be linking to the full-size image
    const parent = img.parentElement;
    if (parent?.tagName === 'A' && parent.href && 
        isImageUrl(parent.href) && !isBase64Image(parent.href)) {
      return parent.href;
    }
    
    // Check for high-quality attributes
    for (const attr of HIGH_QUALITY_ATTRIBUTES) {
      if (img.hasAttribute(attr)) {
        const attrUrl = img.getAttribute(attr);
        if (attrUrl && !isBase64Image(attrUrl)) {
          return attrUrl;
        }
      }
    }
    
    // Check for srcset attribute
    if (img.srcset) {
      const highestRes = extractBestUrlFromSrcset(img.srcset);
      if (highestRes && !isBase64Image(highestRes)) {
        return highestRes;
      }
    }
    
    // Check if the src is not base64
    if (img.src && !isBase64Image(img.src)) {
      // Try to find the original version by modifying common URL patterns
      if (img.src.includes('thumb') || img.src.includes('small') || 
          img.src.includes('preview') || img.src.includes('display_') || 
          img.src.includes('resize')) {
        
        const cleanedUrl = cleanThumbnailUrl(img.src);
        return cleanedUrl;
      }
      
      return img.src;
    }
    
    // For base64 images, try to find the original URL from the page context
    if (isBase64Image(img.src)) {
      const pageImageUrl = findImageUrlInPageContent();
      if (pageImageUrl) {
        return pageImageUrl;
      }
      
      console.warn('ClickLink: Only base64 image data available, original URL not found');
    }
    
    // Fall back to src as last resort
    return img.src;
    
  } catch (error) {
    console.error('ClickLink: Error getting image URL:', error);
    return img.src;
  }
}

// Function to store image URL with enhanced error handling and retry logic
async function storeImageUrl(imageUrl) {
  if (!imageUrl) {
    console.warn('ClickLink: No URL provided to store');
    return;
  }
  
  console.log('ClickLink: Attempting to store URL:', imageUrl);
  
  try {
    // Use Promise-based approach for better error handling
    const result = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['urlList'], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(data);
      });
    });
    
    const urlList = result.urlList || [];
    console.log('ClickLink: Current URL list length before adding:', urlList.length);
    console.log('ClickLink: Current URL list:', urlList);
    
    // Add the new URL
    urlList.push(imageUrl);
    console.log('ClickLink: URL list after adding new URL:', urlList);
    
    // Store the updated list
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ 
        lastUrl: imageUrl,
        urlList: urlList 
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    });
    
    console.log('ClickLink: ✅ Successfully stored URL:', imageUrl);
    console.log('ClickLink: ✅ Total URLs now stored:', urlList.length);
    
    // Verify storage by reading it back
    const verification = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['urlList'], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(data);
      });
    });
    
    console.log('ClickLink: ✅ Verification - URLs in storage:', verification.urlList?.length || 0);
    
  } catch (error) {
    console.error('ClickLink: ❌ Error in storeImageUrl function:', error);
    
    // Try a fallback approach
    try {
      console.log('ClickLink: Attempting fallback storage method...');
      chrome.storage.local.get(['urlList'], (data) => {
        const urlList = data.urlList || [];
        urlList.push(imageUrl);
        chrome.storage.local.set({ 
          lastUrl: imageUrl,
          urlList: urlList 
        });
        console.log('ClickLink: Fallback storage completed');
      });
    } catch (fallbackError) {
      console.error('ClickLink: ❌ Fallback storage also failed:', fallbackError);
    }
  }
}

// Handle right-click events with improved error handling
document.addEventListener('contextmenu', async (event) => {
  try {
    console.log('ClickLink: Context menu event triggered');
    console.log('ClickLink: Alt key pressed:', isAltKeyPressed);
    console.log('ClickLink: Extension enabled:', isEnabled);
    console.log('ClickLink: Target element:', event.target.tagName);
    
    // Check if Alt key is pressed and feature is enabled
    if ((isAltKeyPressed || event.altKey) && isEnabled) {
      console.log('ClickLink: Conditions met for capture');
      
      // Check if target is an image
      if (event.target.tagName === 'IMG') {
        console.log('ClickLink: Image detected, capturing...');
        event.preventDefault(); // Prevent context menu early
        
        const img = event.target;
        const imageUrl = getHighestQualityImageUrl(img);
        
        console.log('ClickLink: Extracted image URL:', imageUrl);
        
        if (imageUrl) {
          // Visual feedback first
          img.style.outline = '3px solid #4CAF50';
          setTimeout(() => {
            img.style.outline = '';
          }, 1000);
          
          // Store the URL
          await storeImageUrl(imageUrl);
        } else {
          console.warn('ClickLink: No valid image URL found');
        }
      } else {
        console.log('ClickLink: Target is not an image:', event.target.tagName);
      }
    } else {
      console.log('ClickLink: Conditions not met - Alt:', (isAltKeyPressed || event.altKey), 'Enabled:', isEnabled);
    }
  } catch (error) {
    console.error('ClickLink: Error handling right-click:', error);
  }
});

// Performance optimization: Use passive event listeners where possible
document.addEventListener('keydown', (e) => {
  if (e.key === 'Alt') isAltKeyPressed = true;
}, { passive: true });

document.addEventListener('keyup', (e) => {
  if (e.key === 'Alt') isAltKeyPressed = false;
}, { passive: true });
