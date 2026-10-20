// Parser do README do celowiz/second-brain (awesome-list) para o JSON da página /second-brain/.
// Funções puras, sem rede: o download e o fallback ficam em scripts/sync-second-brain.mjs.

export const README_URL = 'https://raw.githubusercontent.com/celowiz/second-brain/main/README.md';
export const REPO_URL = 'https://github.com/celowiz/second-brain';

/** Seções H2 que não são listas de links (sumário, tabela de livros, backlog de curadoria). */
const SKIP_SECTIONS = [/table of contents/i, /^books$/i, /curation backlog/i];

/** Flags de status em `code` no fim da linha. id estável -> texto no README. */
export const STATUS_FLAGS = {
  bot: '🤖 bloqueia bot',
  archived: '📦 arquivado',
  login: '🔒 exige login',
  broken: '❌ 404',
  offline: '⏸️ fora do ar',
  nourl: '🔗 sem URL',
  duplicate: '🔁 duplicado',
};

export const MIN_ITEMS = 100;
export const MIN_CATEGORIES = 5;

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "🎓 Learning Materials" -> { emoji: '🎓', name: 'Learning Materials' } */
export function splitHeading(raw) {
  const text = String(raw).replace(/<!--.*?-->/g, '').trim();
  const match = text.match(/^(\S+)\s+(.+)$/);
  if (match && !/[\p{L}\p{N}]/u.test(match[1])) {
    return { emoji: match[1], name: match[2].trim() };
  }
  return { emoji: '', name: text };
}

export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Título para linhas que são só uma URL: owner/repo no GitHub, senão o último trecho do caminho. */
export function titleFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const host = parsed.hostname.replace(/^www\./, '');
  const parts = parsed.pathname.split('/').filter(Boolean).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  if (host === 'github.com' && parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  if (parts.length === 0) return host;
  const last = parts[parts.length - 1]
    .replace(/\.(html?|php|ipynb|pdf)$/i, '')
    .replace(/[-_+]+/g, ' ')
    .trim();
  if (!last) return host;
  return last.charAt(0).toUpperCase() + last.slice(1);
}

function cleanInline(text) {
  return String(text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*|__/g, '')
    .replace(/`/g, '')
    .replace(/\\([\\`*_{}[\]()#+\-.!&])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFlags(rest) {
  const flags = [];
  let text = rest;
  for (const [id, label] of Object.entries(STATUS_FLAGS)) {
    const token = `\`${label}\``;
    if (text.includes(token)) {
      flags.push(id);
      text = text.split(token).join(' ');
    }
  }
  return { flags, text };
}

const LINK_LINE = /^(\s*)[-*]\s+\[((?:[^\]\\]|\\.)+)\]\((\S+?)\)(.*)$/;
const BARE_LINE = /^(\s*)[-*]\s+(?:([^:\s][^:]*?):\s+)?(https?:\/\/\S+)\s*$/;

/**
 * Lê o README e devolve { categories, items }.
 * categories: [{ id, emoji, name, subs: [{ id, emoji, name }] }] (só as que têm links)
 * items: [{ n, u, d, x, c, s, f, lvl }] (nome, url, domínio, descrição, categoria, subcategoria, flags, nível)
 */
export function parseSecondBrainReadme(markdown) {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const categories = [];
  const items = [];
  let cat = null;
  let sub = null;
  let skipping = true;

  const ensureSub = () => {
    if (sub) return sub;
    sub = { id: `${cat.id}/geral`, emoji: '', name: '' };
    cat.subs.push(sub);
    return sub;
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      const { emoji, name } = splitHeading(line.slice(3));
      skipping = SKIP_SECTIONS.some((re) => re.test(name));
      if (skipping) {
        cat = null;
        sub = null;
        continue;
      }
      cat = { id: slugify(name), emoji, name, subs: [] };
      categories.push(cat);
      sub = null;
      continue;
    }
    if (skipping || !cat) continue;
    if (line.startsWith('### ')) {
      const { emoji, name } = splitHeading(line.slice(4));
      sub = { id: `${cat.id}/${slugify(name)}`, emoji, name };
      cat.subs.push(sub);
      continue;
    }

    let indent;
    let name;
    let url;
    let rest = '';
    const link = line.match(LINK_LINE);
    const bare = link ? null : line.match(BARE_LINE);
    if (link) {
      [, indent, name, url, rest] = link;
    } else if (bare) {
      let label;
      [, indent, label, url] = bare;
      name = label ? label.trim() : titleFromUrl(url);
    } else {
      continue;
    }
    if (!/^https?:\/\//i.test(url)) continue;

    const { flags, text } = extractFlags(rest);
    const description = cleanInline(text.replace(/^\s*[-—–:]\s*/, ''));
    const current = ensureSub();
    items.push({
      n: cleanInline(name),
      u: url,
      d: domainOf(url),
      x: description,
      c: cat.id,
      s: current.id,
      f: flags,
      lvl: indent.replace(/\t/g, '  ').length >= 2 ? 1 : 0,
    });
  }

  const used = new Set(items.map((item) => item.s));
  const cats = categories
    .map((c) => ({ ...c, subs: c.subs.filter((s) => used.has(s.id)) }))
    .filter((c) => c.subs.length > 0);
  return { categories: cats, items };
}

export function countSubcategories(categories) {
  return categories.reduce((acc, c) => acc + c.subs.filter((s) => s.name).length, 0);
}

export function buildPayload(markdown, { generatedAt = new Date().toISOString(), commit } = {}) {
  const { categories, items } = parseSecondBrainReadme(markdown);
  return {
    version: 1,
    generatedAt,
    source: { repo: REPO_URL, file: 'README.md', ...(commit ? { commit } : {}) },
    counts: {
      links: items.length,
      categories: categories.length,
      subcategories: countSubcategories(categories),
    },
    categories,
    items,
  };
}

/** Lista de problemas; vazia quando o JSON pode ser publicado. */
export function validatePayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') return ['payload ausente'];
  const { categories = [], items = [] } = payload;
  if (items.length < MIN_ITEMS) errors.push(`só ${items.length} links (mínimo ${MIN_ITEMS})`);
  if (categories.length < MIN_CATEGORIES) {
    errors.push(`só ${categories.length} categorias (mínimo ${MIN_CATEGORIES})`);
  }
  const catIds = new Set(categories.map((c) => c.id));
  const subIds = new Set(categories.flatMap((c) => c.subs.map((s) => s.id)));
  if (catIds.size !== categories.length) errors.push('ids de categoria repetidos');
  for (const item of items) {
    if (!item.n) errors.push(`item sem nome: ${item.u}`);
    if (!/^https?:\/\//.test(item.u)) errors.push(`URL inválida: ${item.u}`);
    if (!catIds.has(item.c) || !subIds.has(item.s)) errors.push(`categoria desconhecida: ${item.u}`);
    if (errors.length > 20) break;
  }
  if (payload.counts && payload.counts.links !== items.length) errors.push('contador de links não bate');
  return errors;
}
