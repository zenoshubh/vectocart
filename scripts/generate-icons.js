#!/usr/bin/env node
/**
 * Script to generate PNG icons from SVG
 * Requires: npm install -D sharp
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    // Try to use sharp if available
    const sharp = require('sharp');
    
    const svgPath = path.join(__dirname, '../public/icon.svg');
    const iconDir = path.join(__dirname, '../public/icon');
    
    // Ensure icon directory exists
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }
    
    const sizes = [16, 32, 48, 96, 128];
    
    console.log('Generating icon PNGs from SVG...');
    
    for (const size of sizes) {
      const outputPath = path.join(iconDir, `${size}.png`);
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${size}x${size}.png`);
    }
    
    console.log('✓ All icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('Error: sharp module not found.');
      console.error('Please install it by running: npm install -D sharp');
      console.error('\nAlternatively, you can:');
      console.error('1. Use an online SVG to PNG converter');
      console.error('2. Use ImageMagick: convert -background none -resize 16x16 public/icon.svg public/icon/16.png');
      console.error('3. Use Inkscape or another vector graphics tool');
      process.exit(1);
    } else {
      console.error('Error generating icons:', error);
      process.exit(1);
    }
  }
}

generateIcons();

