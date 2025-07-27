# ClickLink - Chrome Extension

A powerful Chrome extension for capturing high-quality image URLs with a simple Alt+Right Click gesture. Perfect for researchers, designers, and anyone who needs to collect image URLs efficiently.

## 🚀 Features

- **Smart Image Capture**: Alt+Right Click on any image to capture its highest quality URL
- **High-Quality Detection**: Automatically finds the best resolution version of images
- **Dual Export Modes**: Export as text file (URLs) or ZIP file (actual images)
- **Duplicate Management**: Built-in duplicate detection and removal
- **Visual Feedback**: Green outline confirmation when images are captured
- **Storage Management**: View captured URL count and manage your collection
- **Debug Tools**: Built-in debugging and testing utilities

## 📋 Prerequisites

- **Google Chrome** (version 88 or higher)
- **Chrome Extensions Developer Mode** enabled (for manual installation)
- **Internet Connection** (required for ZIP export functionality)

## 🔧 Installation

### Method 1: Manual Installation (Recommended)

1. **Download the Extension**
   ```bash
   git clone <repository-url>
   # OR download and extract the ZIP file
   ```

2. **Enable Developer Mode**
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle "Developer mode" in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `click-link-extension` folder
   - The extension icon should appear in your toolbar

**Note**: All required files including `jszip.min.js` are included in the package.

### Method 2: Build from Source

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd click-link-extension
   ```

2. **Install Dependencies** (Optional)
   ```bash
   npm install
   ```

3. **Create Distribution Package**
   ```bash
   npm run zip
   ```

## 📖 Usage Guide

### Basic Usage

1. **Enable the Extension**
   - Click the ClickLink icon in your Chrome toolbar
   - Toggle "Alt + Right Click" to ON

2. **Capture Image URLs**
   - Hold `Alt` key
   - Right-click on any image
   - See green outline confirmation
   - URL is automatically stored

3. **View Captured URLs**
   - Click the extension icon to see count
   - Use "Export" to download your collection

### Export Options

#### Text Export (Default)
- Exports all unique URLs as a `.txt` file
- One URL per line
- Perfect for bulk downloading or processing

#### ZIP Export (File Mode)
1. Toggle "File Mode" to ON
2. Click "Export ZIP"
3. Downloads actual images in a compressed ZIP file
4. Images are automatically named (`image-1.jpg`, `image-2.png`, etc.)

### Management Features

- **Clear All**: Remove all captured URLs
- **Remove Duplicates**: Clean up duplicate entries
- **Debug Info**: View detailed storage information
- **Test URLs**: Add sample URLs for testing

## 🛠️ Technical Details

### Architecture

```
├── manifest.json          # Extension configuration
├── background.js          # Service worker for extension lifecycle
├── content.js            # Main capture logic and DOM interaction
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality and UI logic
├── jszip.min.js          # ZIP file generation library
└── images/               # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Key Technologies

- **Manifest V3**: Latest Chrome extension standard
- **Chrome Storage API**: Local data persistence
- **JSZip Library**: ZIP file generation for image export
- **Content Scripts**: DOM interaction and event handling
- **Service Workers**: Background processing

### Permissions Required

- `storage`: Save captured URLs locally
- `contextMenus`: Alternative capture method
- `downloads`: File export functionality

### Smart Image Detection

The extension uses advanced algorithms to find the highest quality image:

1. **Picture Element Sources**: Checks `<picture>` elements for high-res sources
2. **Parent Link Detection**: Looks for parent `<a>` tags linking to full images
3. **High-Quality Attributes**: Searches for data attributes like:
   - `data-src-original`
   - `data-high-res-src`
   - `data-zoom-image`
   - And 15+ other common patterns
4. **Srcset Processing**: Extracts highest resolution from `srcset` attributes
5. **URL Cleaning**: Removes thumbnail indicators from URLs
6. **Base64 Handling**: Attempts to find original URLs for base64 images

## 🔍 Troubleshooting

### Common Issues

**Extension not capturing images:**
- Ensure "Alt + Right Click" toggle is enabled
- Check that you're holding Alt while right-clicking
- Verify the target is actually an `<img>` element

**Export not working:**
- Check browser's download settings
- Ensure popup blockers aren't interfering
- For ZIP export, verify internet connection

**No URLs showing:**
- Use "Debug Info" button to check storage
- Try "Add Test URLs" to verify functionality
- Check browser console for error messages

### Debug Mode

1. Click "Debug Info" in the popup
2. Open Chrome DevTools (F12)
3. Check Console tab for detailed logs
4. Look for "ClickLink:" prefixed messages

### Storage Issues

If URLs aren't being saved:
```javascript
// Check storage in DevTools Console
chrome.storage.local.get(null, console.log);

// Clear storage if needed
chrome.storage.local.clear();
```

## 🔒 Privacy & Security

- **Local Storage Only**: All data stays on your device
- **No External Servers**: No data transmitted to third parties
- **Minimal Permissions**: Only requests necessary permissions
- **Open Source**: Full code transparency

## 🚧 Development

### Project Structure

```
click-link-extension/
├── src/
│   ├── background.js     # Service worker
│   ├── content.js        # Content script
│   ├── popup.html        # UI template
│   └── popup.js          # UI logic
├── images/               # Icons and assets
├── manifest.json         # Extension manifest
├── package.json          # NPM configuration
└── README.md            # This file
```

### Build Scripts

```bash
# Create distribution ZIP
npm run zip

# Clean build artifacts
npm run clean

# Development (no build needed)
# Just load unpacked in Chrome
```

### Testing

1. **Manual Testing**
   - Use "Add Test URLs" button
   - Test on various websites
   - Verify export functionality

2. **Console Debugging**
   - Enable verbose logging
   - Monitor storage operations
   - Check error handling

## 📝 Changelog

### Version 1.1
- Added ZIP export functionality
- Improved high-quality image detection
- Enhanced error handling and logging
- Added duplicate removal feature
- Better visual feedback

### Version 1.0
- Initial release
- Basic Alt+Right Click capture
- Text export functionality
- Chrome storage integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues, questions, or feature requests:
1. Check the troubleshooting section above
2. Use the "Debug Info" feature
3. Create an issue with detailed information

---

**Made with ❤️ for efficient image URL collection**