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

const FAVICON_SVG = path.join(IMAGES, 'favicon.svg');

/**
 * Ícones de app (PWA e apple-touch) gerados a partir do favicon MW (public/images/favicon.svg),
 * a mesma fonte do favicon das abas. Antes eram desenhados aqui com o monograma antigo "DEV"
 * e sobrescreviam os ícones MW a cada build. Os ícones do /second-brain/ ficam em
 * public/images/second-brain/ e não são tocados.
 */
export function bleedIconSvg(faviconSvg, scale) {
  // Troca o tile arredondado por um fundo quadrado sólido (o iOS e o Android aplicam a
  // própria máscara) e escala o desenho em torno do centro para caber na zona segura.
  const inner = faviconSvg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<rect[^>]*\/>/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0b0d10"/><g transform="translate(32 32) scale(${scale}) translate(-32 -32)">${inner}</g></svg>`;
}

async function writePngFromSvg(svg, dest, width, height) {
  // Rasteriza já no tamanho final (sem ampliar um PNG pequeno): densidade proporcional à
  // largura do viewBox, para SVGs sem width/height como o favicon (viewBox 0 0 64 64).
  const hasSize = /<svg[^>]*\swidth="/.test(svg);
  const viewBoxWidth = Number(svg.match(/viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)/)?.[1] ?? width);
  const density = hasSize ? 72 : Math.min(2400, (72 * width) / viewBoxWidth);
  await sharp(Buffer.from(svg), { density })
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
  const favicon = await fs.readFile(FAVICON_SVG, 'utf8');
  await writePngFromSvg(favicon, path.join(IMAGES, 'icon-192.png'), 192, 192);
  await writePngFromSvg(favicon, path.join(IMAGES, 'icon-512.png'), 512, 512);
  await writePngFromSvg(bleedIconSvg(favicon, 0.75), path.join(IMAGES, 'icon-maskable-512.png'), 512, 512);
  await writePngFromSvg(bleedIconSvg(favicon, 0.92), path.join(IMAGES, 'apple-touch-icon.png'), 180, 180);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  generateSiteAssets().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
