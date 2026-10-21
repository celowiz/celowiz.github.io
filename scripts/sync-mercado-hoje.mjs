// Baixa os data/summary.json dos subprojetos e gera public/mercado-hoje.json (Mercado Hoje).
//
// Fallback por bloco: se um summary.json não existir, falhar ou vier fora do formato, usa o
// mesmo bloco do mercado-hoje.json que está no ar (https://celowiz.github.io/mercado-hoje.json)
// ou, se nem ele estiver disponível, o versionado no repo. Cada bloco leva a própria data
// (as_of) e a página esconde o que estiver velho (> STALE_DAYS). Nunca derruba o deploy.
// O bloco bcb vem de .cache/bcb-sgs.json (scripts/fetch_bcb.py, passo anterior do workflow).
// MERCADO_HOJE_LOCAL=<pasta> lê <pasta>/<bloco>.json (b3, rrg, hmm, pairs, bcb) em vez da rede (prévia local).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOCKS, SITE, SOURCES, buildPayload, validatePayload } from './lib/mercado-hoje.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'mercado-hoje.json');
const UA = { 'User-Agent': 'celowiz.github.io-mercado-hoje-sync/1.0' };

async function getJson(url) {
  const r = await fetch(url, { headers: UA, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`GET ${url}: ${r.status}`);
  return r.json();
}

async function load(kind) {
  try {
    if (kind === 'bcb') {
      const file = process.env.MERCADO_HOJE_LOCAL ? path.join(process.env.MERCADO_HOJE_LOCAL, 'bcb.json') : path.join(ROOT, SOURCES.bcb);
      return JSON.parse(await fs.readFile(file, 'utf8'));
    }
    if (process.env.MERCADO_HOJE_LOCAL) return JSON.parse(await fs.readFile(path.join(process.env.MERCADO_HOJE_LOCAL, `${kind}.json`), 'utf8'));
    return await getJson(SOURCES[kind]);
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

async function previousPayload() {
  const candidates = [];
  if (!process.env.MERCADO_HOJE_LOCAL) candidates.push(() => getJson(`${SITE}/mercado-hoje.json`));
  candidates.push(async () => JSON.parse(await fs.readFile(OUT, 'utf8')));
  for (const get of candidates) {
    try {
      const p = await get();
      if (!validatePayload(p).length) return p;
    } catch {
      // tenta o próximo
    }
  }
  return null;
}

async function summary(text) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${text}\n`).catch(() => {});
}

export async function syncMercadoHoje() {
  const fetched = Object.fromEntries(await Promise.all(BLOCKS.map(async (k) => [k, await load(k)])));
  const payload = buildPayload(fetched, await previousPayload());
  const lines = BLOCKS.map((k) => {
    const s = payload.sources[k];
    const icon = s.status === 'ok' ? '✅' : s.status === 'fallback' || s.status === 'partial' ? '⚠️' : '❌';
    return `${icon} Mercado Hoje · ${k}: ${s.status}${s.as_of ? ` (dados de ${s.as_of})` : ''}${s.kept ? ` · mantidos: ${s.kept.join(', ')}` : ''}${s.error ? ` · ${s.error}` : ''}`;
  });
  for (const line of lines) {
    if (line.startsWith('✅')) console.log(line);
    else console.warn(`::warning title=sync-mercado-hoje::${line}`);
    await summary(line);
  }
  await fs.writeFile(OUT, `${JSON.stringify(payload)}\n`);
  console.log(`${path.relative(ROOT, OUT)}: ${(JSON.stringify(payload).length / 1024).toFixed(1)} KB`);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) syncMercadoHoje();
