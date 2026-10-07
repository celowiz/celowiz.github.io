import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'public', 'images');

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function ogSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#030712"/>
      <stop offset="45%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>
  </defs>
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${OG_WIDTH}" height="8" fill="url(#bar)"/>
  <circle cx="1040" cy="90" r="160" fill="#1d4ed8" opacity="0.18"/>
  <circle cx="160" cy="540" r="180" fill="#2563eb" opacity="0.12"/>
  ${Array.from({ length: 48 }, (_, i) => {
    const x = 80 + (i % 12) * 90;
    const y = 70 + Math.floor(i / 12) * 130;
    return `<circle cx="${x}" cy="${y}" r="1.6" fill="#93c5fd" opacity="0.28"/>`;
  }).join('\n  ')}
  <text x="90" y="250" fill="#f9fafb" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="64" font-weight="700">Marcelo Wizenberg</text>
  <text x="90" y="330" fill="#60a5fa" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="32" font-weight="500">Quant Developer · Trader · Analyst</text>
  <text x="90" y="520" fill="#9ca3af" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="22">celowiz.github.io</text>
</svg>`;
}

function appIconSvg(size, padding) {
  const inner = size - padding * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#1f2937"/>
  <g transform="translate(${padding} ${padding})">
    <svg width="${inner}" height="${inner}" viewBox="0 0 32 32">
      <path fill="#93c5fd" d="M 2 7 L 2 25 L 30 25 L 30 7 L 2 7 z M 4 9 L 28 9 L 28 23 L 4 23 L 4 9 z M 6 11 L 6 21 L 9 21 C 10.654 21 12 19.654 12 18 L 12 14 C 12 12.346 10.654 11 9 11 L 6 11 z M 16 11 C 14.897 11 14 11.897 14 13 L 14 19 C 14 20.103 14.897 21 16 21 L 18 21 L 18 19 L 16 19 L 16 17 L 18 17 L 18 15 L 16 15 L 16 13 L 18 13 L 18 11 L 16 11 z M 19.691406 11 L 21.775391 20.025391 C 21.907391 20.595391 22.415 21 23 21 C 23.585 21 24.092609 20.595391 24.224609 20.025391 L 26.308594 11 L 24.255859 11 L 23 16.439453 L 21.744141 11 L 19.691406 11 z M 8 13 L 9 13 C 9.552 13 10 13.448 10 14 L 10 18 C 10 18.552 9.552 19 9 19 L 8 19 L 8 13 z"/>
    </svg>
  </g>
</svg>`;
}

async function writePngFromSvg(svg, dest, width, height) {
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toFile(dest);
  console.log(`wrote ${path.relative(ROOT, dest)} (${width}×${height})`);
}

async function copyInterLatin() {
  const source = path.join(
    ROOT,
    'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'
  );
  const destDir = path.join(ROOT, 'public', 'fonts');
  await fs.mkdir(destDir, { recursive: true });
  await fs.copyFile(source, path.join(destDir, 'inter-latin-wght-normal.woff2'));
  console.log('wrote public/fonts/inter-latin-wght-normal.woff2');
}

export async function generateSiteAssets() {
  await fs.mkdir(IMAGES, { recursive: true });
  await copyInterLatin();
  await writePngFromSvg(ogSvg(), path.join(IMAGES, 'portfolio-preview.png'), OG_WIDTH, OG_HEIGHT);
  await writePngFromSvg(appIconSvg(192, 28), path.join(IMAGES, 'icon-192.png'), 192, 192);
  await writePngFromSvg(appIconSvg(512, 72), path.join(IMAGES, 'icon-512.png'), 512, 512);
  await writePngFromSvg(appIconSvg(512, 96), path.join(IMAGES, 'icon-maskable-512.png'), 512, 512);
  await writePngFromSvg(appIconSvg(180, 26), path.join(IMAGES, 'apple-touch-icon.png'), 180, 180);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  generateSiteAssets().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
