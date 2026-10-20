// Baixa o README do celowiz/second-brain e gera public/second-brain.json.
//
// Fallback: se o download, o parse ou a validação falharem, o JSON versionado no repo
// (último válido) é mantido e o script sai com 0, deixando um aviso no log e no resumo
// do job. Assim o deploy diário (que também atualiza a estante) não quebra por causa de
// uma mudança de formato no README. Se não houver JSON válido versionado, falha (exit 1).
// SECOND_BRAIN_STRICT=1 faz qualquer falha encerrar com erro.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { README_URL, buildPayload, validatePayload } from './lib/second-brain.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'second-brain.json');
const UA = { 'User-Agent': 'celowiz.github.io-second-brain-sync/1.0' };

async function fetchText(url) {
  const response = await fetch(url, { headers: UA });
  if (!response.ok) throw new Error(`GET ${url}: ${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchCommit() {
  try {
    const response = await fetch('https://api.github.com/repos/celowiz/second-brain/commits/main', {
      headers: { ...UA, Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    return typeof data.sha === 'string' ? data.sha.slice(0, 7) : undefined;
  } catch {
    return undefined;
  }
}

async function readExisting() {
  try {
    const payload = JSON.parse(await fs.readFile(OUT, 'utf8'));
    return validatePayload(payload).length === 0 ? payload : null;
  } catch {
    return null;
  }
}

async function summary(text) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${text}\n`).catch(() => {});
}

export async function syncSecondBrain() {
  const strict = process.env.SECOND_BRAIN_STRICT === '1';
  try {
    const [markdown, commit] = await Promise.all([fetchText(process.env.SECOND_BRAIN_README_URL || README_URL), fetchCommit()]);
    const payload = buildPayload(markdown, { commit });
    const errors = validatePayload(payload);
    if (errors.length) throw new Error(`README inválido: ${errors.join('; ')}`);
    await fs.writeFile(OUT, `${JSON.stringify(payload)}\n`);
    const { links, categories, subcategories } = payload.counts;
    const msg = `Second Brain: ${links} links, ${categories} categorias, ${subcategories} subcategorias${commit ? ` (commit ${commit})` : ''}`;
    console.log(`${msg} -> ${path.relative(ROOT, OUT)}`);
    await summary(`✅ ${msg}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const existing = await readExisting();
    if (strict || !existing) {
      console.error(`::error title=sync-second-brain::${reason}${existing ? '' : ' (e não há JSON válido versionado para usar)'}`);
      await summary(`❌ Second Brain: ${reason}`);
      process.exitCode = 1;
      return;
    }
    const msg = `${reason}. Mantido o último JSON válido (gerado em ${existing.generatedAt}, ${existing.counts.links} links).`;
    console.warn(`::warning title=sync-second-brain::${msg}`);
    await summary(`⚠️ Second Brain: ${msg}`);
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) syncSecondBrain();
