# VectoCart Browser Extension

Collaborative shopping cart extension - share and collaborate on shopping carts across multiple e-commerce sites.

## Download & Installation

### Automatic Releases

Every time code is pushed to the `main` branch, a new release is automatically created with the latest build.

**Download the latest version:**
1. Go to [Releases](https://github.com/YOUR_USERNAME/vectocart-new/releases/latest)
2. Download the `vectocart-extension.zip` file
3. Extract the zip file to a folder
4. Open Chrome/Edge and navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
5. Enable **"Developer mode"** (toggle in the top right corner)
6. Click **"Load unpacked"**
7. Select the extracted folder

### Direct Download Link

You can also use this direct link to always get the latest release:
```
https://github.com/YOUR_USERNAME/vectocart-new/releases/latest/download/vectocart-extension.zip
```

## Development

This project uses WXT + React for building browser extensions.

### Setup

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Create Zip

```bash
pnpm zip
```

## Automatic Releases

This project uses GitHub Actions to automatically:
- Build the extension on every push to `main`
- Create a zip file
- Create a new GitHub Release
- Upload the zip as a release asset

No manual steps required! Just push your code and the release will be created automatically.
