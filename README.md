# VectoCart - Collaborative Shopping Extension

<div align="center">
  <h3>🛒 Share and collaborate on shopping carts across multiple e-commerce sites</h3>
  <p>A Chrome extension that enables real-time collaborative shopping with friends and family</p>
</div>

## 🌟 Features

- **Real-time Collaboration**: Share shopping carts with multiple users in real-time
- **Multi-platform Support**: Works across Amazon, Flipkart, Myntra, AJIO, and Meesho
- **Room-based System**: Create or join shopping rooms with unique codes
- **Smart Product Detection**: Automatically extracts product details from supported sites
- **User Authentication**: Secure sign-in/sign-up with Firebase Auth
- **Responsive Design**: Clean, modern UI optimized for the Chrome sidebar
- **Price Tracking**: View and sort products by price
- **Platform Filtering**: Filter products by e-commerce platform

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn or bun
- Chrome browser (Chromium-based browsers)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vectocart
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Build the extension**
   ```bash
   bun run build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked" and select the `dist` folder

## 📖 Usage

### Getting Started

1. **Install the Extension**: Follow the installation steps above
2. **Click the Extension Icon**: Opens the VectoCart sidebar
3. **Sign Up/Sign In**: Create an account or sign in with existing credentials

### Creating a Room

1. **Enter Room Name**: Type a descriptive name (e.g., "Family Shopping", "Weekend Trip")
2. **Click "Create Room"**: Generates a unique 6-digit room code
3. **Share the Code**: Give the room code to friends/family to join

### Joining a Room

1. **Get Room Code**: Ask the room creator for the 6-digit code
2. **Enter Code**: Type the code in the "Join Room" section
3. **Click "Join Room"**: You'll be added to the shared cart

### Adding Products

1. **Browse Supported Sites**: Visit Amazon, Flipkart, Myntra, AJIO, or Meesho
2. **Navigate to Product Page**: Go to any product page
3. **Click "Add to VectoCart"**: Button appears automatically on product pages
4. **View in Sidebar**: Product appears in your shared cart in real-time

### Managing Products

- **Sort Products**: By recent, price (low to high), or price (high to low)
- **Filter by Platform**: View products from specific e-commerce sites
- **Remove Products**: Click "Remove" button on any product
- **View Product**: Click "View Product" to open original product page

## 🛠️ Technical Architecture

### Frontend Stack
- **React 19**: UI framework
- **Tailwind CSS**: Styling and responsive design
- **Lucide React**: Icon library
- **Vite**: Build tool and development server

### Backend Services
- **Firebase Firestore**: Real-time database for shared carts
- **Firebase Auth**: User authentication and management
- **Chrome Extension APIs**: Content scripts, background service worker

### Key Components

#### Content Script (`src/content/index.js`)
- Detects product pages on supported e-commerce sites
- Extracts product information (name, price, image)
- Injects "Add to VectoCart" button
- Handles product addition via Chrome messaging

#### Background Service Worker (`src/background/index.js`)
- Manages Firebase operations
- Handles extension icon clicks
- Processes context menu interactions
- Manages cross-tab communication

#### Sidebar Application (`src/sidebar/App.jsx`)
- Room creation and management
- Real-time product display
- User authentication flow
- Product filtering and sorting

## 🌐 Supported E-commerce Sites

| Platform | Domain | Product Detection | Price Extraction |
|----------|--------|-------------------|------------------|
| Amazon | amazon.in, amazon.com | ✅ | ✅ |
| Flipkart | flipkart.com | ✅ | ✅ |
| Myntra | myntra.com | ✅ | ✅ |
| AJIO | ajio.com | ✅ | ✅ |
| Meesho | meesho.com | ✅ | ✅ |

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore and Authentication
3. Update Firebase config in `src/lib/firebase.js`

### Extension Permissions
The extension requires these permissions:
- `storage`: Store room information locally
- `activeTab`: Access current tab for product detection
- `scripting`: Inject content scripts
- `contextMenus`: Add context menu options
- `notifications`: Show success/error notifications
- `sidePanel`: Display extension sidebar

### Responsive Design
- Optimized for Chrome sidebar (minimum 320px width)
- Mobile-friendly components
- Adaptive layouts for different screen sizes

## 📱 Browser Compatibility

- **Chrome**: Full support (primary target)
- **Edge**: Compatible (Chromium-based)
- **Brave**: Compatible (Chromium-based)
- **Firefox**: Not supported (different extension architecture)

## 🔐 Security Features

- **Firebase Authentication**: Secure user management
- **Input Validation**: Sanitized user inputs
- **HTTPS Only**: All external communications encrypted
- **Content Security Policy**: Restricted resource loading
- **Permission-based Access**: Minimal required permissions

## 🚨 Troubleshooting

### Common Issues

**Extension not loading:**
- Ensure Chrome Developer mode is enabled
- Check console for build errors
- Verify all dependencies are installed

**Products not being detected:**
- Check if you're on a supported e-commerce site
- Verify you're on a product page (not category/search)
- Refresh the page if button doesn't appear

**Firebase connection issues:**
- Verify Firebase configuration
- Check browser network connectivity
- Ensure Firestore security rules allow access

**Authentication problems:**
- Clear browser cache and cookies
- Check Firebase Auth configuration
- Verify email/password requirements

### Debug Mode
Enable debug logs by opening Chrome DevTools:
1. Right-click extension sidebar → "Inspect"
2. Check Console tab for detailed logs
3. Look for "VectoCart:" prefixed messages

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style
- Use ESLint configuration provided
- Follow React best practices
- Write meaningful commit messages
- Add comments for complex logic

## 🙏 Acknowledgments

- **Firebase**: Real-time database and authentication
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide**: Beautiful icon library
- **React**: UI framework
- **Vite**: Lightning-fast build tool

---

<div align="center">
  <p>Made with ❤️ for collaborative shopping</p>
  <p>© 2025 VectoCart. All rights reserved.</p>
</div>
