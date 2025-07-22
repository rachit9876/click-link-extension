# ClickLink - Image URL Capture Extension

A Chrome extension that allows you to quickly capture high-quality image URLs using Alt+Right Click.

## Features

- **Alt+Right Click**: Capture image URLs with a simple keyboard+mouse combination
- **Smart URL Detection**: Automatically finds the highest quality version of images
- **Bulk Export**: Export all captured URLs as a text file
- **Visual Feedback**: Images briefly highlight when captured
- **Context Menu**: Alternative capture method via right-click menu
- **Persistent Storage**: URLs are saved across browser sessions
- **Duplicate Management**: Remove duplicate URLs with one click
- **Debug Tools**: Built-in debugging and testing features

## How to Use

1. **Enable the extension**: Click the extension icon and toggle "Alt + Right Click" on
2. **Capture URLs**: Hold Alt and right-click on any image to capture its URL
3. **View captured URLs**: Click the extension icon to see the count of captured URLs
4. **Export URLs**: Click "Export TXT" to download all URLs as a text file
5. **Clear URLs**: Click "Clear" to remove all stored URLs
6. **Remove Duplicates**: Click "Remove Duplicates" to clean up your URL list

## Smart Image Detection

The extension intelligently finds the best quality image URL by checking:

- High-resolution srcset attributes
- Picture element sources
- Data attributes (data-original, data-src, etc.)
- Parent link elements
- Cleaned up thumbnail URLs
- URL parameters and page context for base64 images

## Technical Details

### Manifest Version 3
Built using the latest Chrome Extension Manifest V3 with:
- Service worker background script
- Content script injection
- Storage permissions
- Context menu integration

### Files Structure
- `manifest.json` - Extension configuration
- `background.js` - Service worker with context menu handling
- `content.js` - Main functionality for URL capture
- `content_optimized.js` - Optimized version of content script
- `popup.html/js` - Extension popup interface
- `images/` - Extension icons
- `package.json` - Project configuration and build scripts

### Permissions
- `storage` - To save captured URLs
- `contextMenus` - For right-click menu integration

## Development

### Prerequisites
- Chrome browser
- Developer mode enabled in Chrome Extensions

### Installation
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

### Build Scripts
The extension includes several utility scripts in package.json:
- `npm run build` - Placeholder for build process
- `npm run zip` - Creates a ZIP archive of the extension
- `npm run clean` - Removes ZIP files

### Optimization Features
- Modern ES6+ JavaScript
- Comprehensive error handling and logging
- Performance optimizations with passive event listeners
- Modular code structure
- Enhanced UI/UX design
- Promise-based storage operations
- Verification and fallback mechanisms

## Privacy
This extension:
- Only processes data locally on your device
- Does not send any data to external servers
- Stores URLs in Chrome's local storage
- Only activates when explicitly enabled by the user

## Version History

### Current
- Added duplicate URL management
- Enhanced debugging tools
- Improved error handling with fallback mechanisms
- Added visual feedback for captured images
- Better image quality detection algorithms
- Optimized storage operations with Promise-based approach
- Added test URL feature for development

### Initial Release
- Basic Alt+Right Click functionality
- URL storage and export

## License

MIT License - Feel free to modify and distribute.

## Support

For issues or feature requests, please check the extension's error console or create an issue in the repository.