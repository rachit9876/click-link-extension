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

// Function to store image URL
function storeImageUrl(imageUrl) {
  if (!imageUrl) return;
  
  try {
    // Store the URL
    chrome.storage.local.set({ lastUrl: imageUrl });
    
    // Add to URL list for export
    chrome.storage.local.get(['urlList'], (data) => {
      const urlList = data.urlList || [];
      // Only add if not already in the list
      if (!urlList.includes(imageUrl)) {
        urlList.push(imageUrl);
        chrome.storage.local.set({ urlList: urlList });
        console.log('ClickLink: Image URL captured:', imageUrl);
      }
    });
  } catch (error) {
    console.error('ClickLink: Error storing image URL:', error);
  }
}

// Handle right-click events with improved error handling
document.addEventListener('contextmenu', (event) => {
  try {
    // Check if Alt key is pressed and feature is enabled
    if ((isAltKeyPressed || event.altKey) && isEnabled) {
      // Check if target is an image
      if (event.target.tagName === 'IMG') {
        event.preventDefault(); // Prevent context menu early
        
        const img = event.target;
        const imageUrl = getHighestQualityImageUrl(img);
        
        if (imageUrl) {
          storeImageUrl(imageUrl);
          
          // Visual feedback
          img.style.outline = '3px solid #4CAF50';
          setTimeout(() => {
            img.style.outline = '';
          }, 500);
        }
      }
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
