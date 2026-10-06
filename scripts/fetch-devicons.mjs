/**
 * Download Devicon SVGs used by Skills / Projects.
 * Source: https://devicon.dev/ via
 * https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<name>/<name>-original.svg
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICONS = [
  'python',
  'r',
  'javascript',
  'mysql',
  'nextjs',
  'vite',
  'react',
  'nodejs',
  'fastapi',
  'flask',
  'html5',
  'css3',
  'pandas',
  'numpy',
  'scikitlearn',
  'matplotlib',
  'plotly',
  'tensorflow',
  'spyder',
  'postgresql',
  'mongodb',
  'github',
  'streamlit',
  'jupyter',
  'vscode',
  'markdown',
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = path.resolve(__dirname, '../public/icons');

async function fetchIcon(name) {
  const url = `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${name}/${name}-original.svg`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const destDir = path.join(OUT_ROOT, name);
  await fs.mkdir(destDir, { recursive: true });
  const dest = path.join(destDir, `${name}-original.svg`);
  await fs.writeFile(dest, await response.text());
  console.log(`saved ${path.relative(path.resolve(__dirname, '..'), dest)}`);
}

async function main() {
  for (const name of ICONS) {
    await fetchIcon(name);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
