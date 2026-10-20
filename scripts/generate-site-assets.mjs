import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { OG_HEIGHT, OG_WIDTH, homeOgSvg, loadOgFonts, readBrainSvg, secondBrainOgSvg } from './lib/og-images.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'public', 'images');

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

/** PNG de preview social em cor plena (paleta criava faixas no brilho radial); fica bem abaixo de 300 KB. */
async function writeOgPng(svg, dest) {
  if (svg.includes('NaN')) throw new Error(`SVG inválido para ${path.basename(dest)} (coordenada NaN)`);
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(dest);
  const { size } = await fs.stat(dest);
  console.log(`wrote ${path.relative(ROOT, dest)} (${OG_WIDTH}×${OG_HEIGHT}, ${Math.round(size / 1024)} KB)`);
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
  const fonts = await loadOgFonts();
  await writeOgPng(homeOgSvg(fonts), path.join(IMAGES, 'portfolio-preview.png'));
  await writeOgPng(secondBrainOgSvg(fonts, await readBrainSvg(IMAGES)), path.join(IMAGES, 'og-second-brain.png'));
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
