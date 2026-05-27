/**
 * scripts/generate-icons.mjs
 *
 * Generates all PWA icon sizes from /public/icons/icon-source.png
 * using the built-in Canvas API (Node 18+) or sharp if available.
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Prerequisites:
 *   npm install sharp --save-dev
 *
 * The source icon should be at least 512x512 pixels.
 */

import { createCanvas, loadImage } from 'canvas'; // optional: npm i canvas
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE = join(process.cwd(), 'public', 'icons', 'icon-source.png');
const OUTPUT_DIR = join(process.cwd(), 'public', 'icons');

async function generateIcons() {
  try {
    // Try using sharp (lighter, no native deps)
    const sharp = await import('sharp').catch(() => null);

    if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

    if (sharp) {
      for (const size of SIZES) {
        const outPath = join(OUTPUT_DIR, `icon-${size}x${size}.png`);
        await sharp.default(SOURCE).resize(size, size).png().toFile(outPath);
        console.log(`✅ Generated ${size}x${size} → ${outPath}`);
      }
    } else {
      // Fallback: canvas
      const img = await loadImage(SOURCE);
      for (const size of SIZES) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const outPath = join(OUTPUT_DIR, `icon-${size}x${size}.png`);
        writeFileSync(outPath, canvas.toBuffer('image/png'));
        console.log(`✅ Generated ${size}x${size} → ${outPath}`);
      }
    }

    console.log('\n🎉 All PWA icons generated!');
  } catch (error) {
    console.error('❌ Icon generation failed:', error.message);
    console.log('\nTo generate icons manually:');
    console.log('1. Install sharp: npm install sharp --save-dev');
    console.log('2. Place a 512x512 PNG at public/icons/icon-source.png');
    console.log('3. Re-run: node scripts/generate-icons.mjs');
  }
}

generateIcons();
