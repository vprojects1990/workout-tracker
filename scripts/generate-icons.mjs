import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets', 'images');

const svgBuffer = readFileSync(join(assetsDir, 'logo.svg'));

const icons = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'splash-icon.png', size: 200 },
  { name: 'favicon.png', size: 48 },
];

async function generateIcons() {
  for (const icon of icons) {
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(join(assetsDir, icon.name));
    console.log(`Generated ${icon.name} (${icon.size}x${icon.size})`);
  }
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
