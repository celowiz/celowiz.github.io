/**
 * Imagens de preview social (og:image / twitter:image), 1200×630, no visual atual do site
 * (direção A): fundo near-black, nome em serif creme, prompt de terminal teal e partículas
 * sutis como no Hero.
 *
 * O texto vira <path> (opentype.js + fontes OFL do @fontsource), então o PNG não depende das
 * fontes instaladas na máquina: o build do Actions gera exatamente o mesmo arquivo.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const COLORS = {
  ink: '#050506',
  paper: '#f4f1ea',
  teal: '#2dd4bf',
};

const FONT_FILES = {
  serif: '@fontsource/source-serif-4/files/source-serif-4-latin-500-normal.woff',
  mono: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff',
  sans: '@fontsource/inter/files/inter-latin-400-normal.woff',
};

export async function loadOgFonts() {
  const entries = await Promise.all(
    Object.entries(FONT_FILES).map(async ([key, file]) => {
      const buffer = await fs.readFile(require.resolve(file));
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      return [key, opentype.parse(arrayBuffer)];
    })
  );
  return Object.fromEntries(entries);
}

/** Texto como path SVG. anchor: 'start' | 'middle'. letterSpacing em unidades de px. */
export function textPath(font, text, { x, y, size, fill, opacity = 1, anchor = 'start', letterSpacing = 0 }) {
  // Glifo a glifo (sem shaping OpenType, que o opentype.js não cobre por completo nessas
  // fontes), com kerning do par quando a fonte tiver.
  const glyphs = Array.from(text, (char) => font.charToGlyph(char));
  const scale = size / font.unitsPerEm;
  const advances = glyphs.map((glyph, i) => {
    const kern = i < glyphs.length - 1 ? font.getKerningValue(glyph, glyphs[i + 1]) : 0;
    return (glyph.advanceWidth + kern) * scale + (i < glyphs.length - 1 ? letterSpacing : 0);
  });
  const width = advances.reduce((sum, a) => sum + a, 0);
  let cursor = anchor === 'middle' ? x - width / 2 : x;
  const parts = [];
  glyphs.forEach((glyph, i) => {
    parts.push(glyph.getPath(cursor, y, size).toPathData(2));
    cursor += advances[i];
  });
  const opacityAttr = opacity === 1 ? '' : ` fill-opacity="${opacity}"`;
  return { svg: `<path d="${parts.join('')}" fill="${fill}"${opacityAttr}/>`, width };
}

/** PRNG determinístico (mulberry32): mesmas partículas a cada build. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Partículas como no Hero (pontos brancos + ligações teal), mais esparsas e apagadas no
 * centro para não brigar com o texto.
 */
export function particlesSvg({ seed = 7, count = 120, linkDistance = 120 } = {}) {
  const random = rng(seed);
  const cx = OG_WIDTH / 2;
  const cy = OG_HEIGHT / 2;
  const points = [];
  while (points.length < count) {
    const x = random() * OG_WIDTH;
    const y = random() * OG_HEIGHT;
    // Distância elíptica normalizada ao centro: 0 no meio, ~1 nas bordas.
    const d = Math.hypot((x - cx) / (OG_WIDTH * 0.42), (y - cy) / (OG_HEIGHT * 0.36));
    if (d < 0.75 && random() > 0.12) continue;
    const fade = Math.min(1, Math.max(0.15, (d - 0.45) / 0.8));
    points.push({ x, y, r: 0.8 + random() * 2, o: (0.25 + random() * 0.45) * fade, fade });
  }
  const links = [];
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < linkDistance) {
        const o = 0.2 * (1 - dist / linkDistance) * Math.min(a.fade, b.fade);
        if (o > 0.015) {
          links.push(
            `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${COLORS.teal}" stroke-opacity="${o.toFixed(3)}" stroke-width="1"/>`
          );
        }
      }
    }
  }
  const dots = points.map(
    (p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(2)}" fill="#ffffff" fill-opacity="${p.o.toFixed(3)}"/>`
  );
  return `<g>${links.join('')}${dots.join('')}</g>`;
}

function frame(content, { seed }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
<defs><radialGradient id="glow" cx="50%" cy="46%" r="60%"><stop offset="0%" stop-color="${COLORS.teal}" stop-opacity="0.07"/><stop offset="100%" stop-color="${COLORS.teal}" stop-opacity="0"/></radialGradient></defs>
<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${COLORS.ink}"/>
<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#glow)"/>
${particlesSvg({ seed })}
${content}
</svg>`;
}

/** Linha "$ texto█" no estilo do TerminalPrompt do Hero, centralizada. */
function promptLine(fonts, text, y, size) {
  const dollar = textPath(fonts.mono, '$ ', { x: 0, y, size, fill: COLORS.paper });
  const body = textPath(fonts.mono, text, { x: 0, y, size, fill: COLORS.teal });
  const caretW = size * 0.6;
  const total = dollar.width + body.width + caretW * 0.4 + caretW;
  const x0 = OG_WIDTH / 2 - total / 2;
  const d = textPath(fonts.mono, '$ ', { x: x0, y, size, fill: COLORS.paper, opacity: 0.35 });
  const b = textPath(fonts.mono, text, { x: x0 + dollar.width, y, size, fill: COLORS.teal });
  const caretX = x0 + dollar.width + body.width + caretW * 0.4;
  const caret = `<rect x="${caretX.toFixed(1)}" y="${(y - size * 0.78).toFixed(1)}" width="${caretW.toFixed(1)}" height="${(size * 0.95).toFixed(1)}" fill="${COLORS.teal}" fill-opacity="0.75"/>`;
  return d.svg + b.svg + caret;
}

function footerUrl(fonts, url) {
  const label = textPath(fonts.sans, url, {
    x: OG_WIDTH / 2,
    y: 560,
    size: 22,
    fill: COLORS.paper,
    opacity: 0.55,
    anchor: 'middle',
    letterSpacing: 0.6,
  });
  const line = `<rect x="${OG_WIDTH / 2 - 24}" y="516" width="48" height="2" rx="1" fill="${COLORS.teal}" fill-opacity="0.8"/>`;
  return line + label.svg;
}

export function homeOgSvg(fonts) {
  const name = textPath(fonts.serif, 'Marcelo Wizenberg', {
    x: OG_WIDTH / 2,
    y: 300,
    size: 104,
    fill: COLORS.paper,
    anchor: 'middle',
    letterSpacing: -1.5,
  });
  return frame(
    name.svg + promptLine(fonts, 'Quant Developer · Quant Trader · Quant Analyst', 382, 30) + footerUrl(fonts, 'celowiz.github.io'),
    { seed: 7 }
  );
}

/** Variante do /second-brain/: cérebro (mesmo desenho do favicon) + título. */
export function secondBrainOgSvg(fonts, brainSvg) {
  const inner = brainSvg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<rect[^>]*\/>/, '');
  const size = 132;
  const brain = `<g transform="translate(${OG_WIDTH / 2 - size / 2} 88) scale(${size / 64})">${inner}</g>`;
  const title = textPath(fonts.serif, 'Second Brain', {
    x: OG_WIDTH / 2,
    y: 340,
    size: 96,
    fill: COLORS.paper,
    anchor: 'middle',
    letterSpacing: -1.2,
  });
  return frame(
    brain +
      title.svg +
      promptLine(fonts, 'cursos · bibliotecas · dados · papers · livros', 418, 28) +
      footerUrl(fonts, 'celowiz.github.io/second-brain'),
    { seed: 11 }
  );
}

export async function readBrainSvg(imagesDir) {
  return fs.readFile(path.join(imagesDir, 'second-brain', 'favicon.svg'), 'utf8');
}

/**
 * Leque de Monte Carlo (bandas P5–P95 e P25–P75, mediana e algumas trajetórias), o mesmo
 * desenho do demo do /lab/, em miniatura. Determinístico (rng com semente fixa).
 */
export function fanGlyphSvg({ x, y, width, height, seed = 5 }) {
  const random = rng(seed);
  const steps = 48;
  const mid = y + height * 0.52;
  const X = (i) => x + (width * i) / steps;
  // Abertura ~√t, com leve deriva para cima (mediana sobe devagar).
  const spread = (i, k) => k * height * 0.5 * Math.sqrt(i / steps);
  const median = (i) => mid - height * 0.12 * (i / steps);
  const band = (k, opacity) => {
    const top = [];
    const bottom = [];
    for (let i = 0; i <= steps; i += 1) {
      top.push(`${X(i).toFixed(1)},${(median(i) - spread(i, k)).toFixed(1)}`);
      bottom.unshift(`${X(i).toFixed(1)},${(median(i) + spread(i, k) * 0.8).toFixed(1)}`);
    }
    return `<polygon points="${top.concat(bottom).join(' ')}" fill="${COLORS.teal}" fill-opacity="${opacity}"/>`;
  };
  const paths = [];
  for (let p = 0; p < 9; p += 1) {
    let v = 0;
    const pts = [];
    for (let i = 0; i <= steps; i += 1) {
      // Soma de 48 uniformes(−½, ½): desvio-padrão final ≈ 2, então v/2 cai quase sempre na banda.
      if (i) v += random() - 0.5;
      const yy = median(i) + (v / 2) * height * 0.42 * (v < 0 ? 0.8 : 1);
      pts.push(`${X(i).toFixed(1)},${Math.min(y + height, Math.max(y, yy)).toFixed(1)}`);
    }
    paths.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="${COLORS.paper}" stroke-opacity="0.16" stroke-width="1.2"/>`);
  }
  const medianLine = Array.from({ length: steps + 1 }, (_, i) => `${X(i).toFixed(1)},${median(i).toFixed(1)}`).join(' ');
  const s0 = `<line x1="${x}" y1="${mid}" x2="${x + width}" y2="${mid}" stroke="${COLORS.paper}" stroke-opacity="0.3" stroke-width="1.2" stroke-dasharray="5 5"/>`;
  return (
    band(1, 0.14) +
    band(0.5, 0.26) +
    paths.join('') +
    s0 +
    `<polyline points="${medianLine}" fill="none" stroke="${COLORS.teal}" stroke-width="3" stroke-linecap="round"/>`
  );
}

/** Variante do /lab/: leque de Monte Carlo + título. */
export function labOgSvg(fonts) {
  const glyph = fanGlyphSvg({ x: OG_WIDTH / 2 - 130, y: 92, width: 260, height: 120 });
  const title = textPath(fonts.serif, 'Lab', {
    x: OG_WIDTH / 2,
    y: 340,
    size: 112,
    fill: COLORS.paper,
    anchor: 'middle',
    letterSpacing: -1.2,
  });
  return frame(
    glyph +
      title.svg +
      promptLine(fonts, 'monte carlo · fronteira · pares · kelly · black-scholes', 418, 26) +
      footerUrl(fonts, 'celowiz.github.io/lab'),
    { seed: 13 }
  );
}
