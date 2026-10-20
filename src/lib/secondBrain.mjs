// Filtros, estado na URL e destaque de busca da página /second-brain/ (sem React, testável com node:test).

export const ALL = 'all';
export const NO_FLAGS = 'ok';

export function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function readUrlState(search) {
  const params = new URLSearchParams(search || '');
  return {
    q: (params.get('q') || '').slice(0, 100),
    cat: params.get('cat') || ALL,
    status: params.get('status') || ALL,
  };
}

/** Querystring para compartilhar a busca atual ('' quando não há filtro). */
export function toSearch(state) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.cat && state.cat !== ALL) params.set('cat', state.cat);
  if (state.status && state.status !== ALL) params.set('status', state.status);
  const out = params.toString();
  return out ? `?${out}` : '';
}

/** subLabel: nome da subcategoria do item (entra na busca). */
export function matchItem(item, state, subLabel = '') {
  if (state.cat && state.cat !== ALL && item.c !== state.cat) return false;
  if (state.status === NO_FLAGS && item.f.length > 0) return false;
  if (state.status && state.status !== ALL && state.status !== NO_FLAGS && !item.f.includes(state.status)) {
    return false;
  }
  const q = normalizeText(state.q).trim();
  if (!q) return true;
  return normalizeText(`${item.n} ${item.d} ${item.x} ${subLabel}`).includes(q);
}

/** Divide o texto em trechos { text, hit } sem perder acentos do original. */
export function highlightParts(text, query) {
  const source = String(text ?? '');
  const q = normalizeText(query).trim();
  if (!q) return [{ text: source, hit: false }];
  const haystack = normalizeText(source);
  // NFD + remoção de acentos preserva o comprimento só para caracteres latinos pré-compostos;
  // se não preservar, não destaca (a busca continua funcionando).
  if (haystack.length !== source.length) return [{ text: source, hit: false }];
  const parts = [];
  let from = 0;
  let at = haystack.indexOf(q, from);
  while (at >= 0) {
    if (at > from) parts.push({ text: source.slice(from, at), hit: false });
    parts.push({ text: source.slice(at, at + q.length), hit: true });
    from = at + q.length;
    at = haystack.indexOf(q, from);
  }
  if (from < source.length) parts.push({ text: source.slice(from), hit: false });
  return parts;
}

export function domId(prefix, id) {
  return `${prefix}-${String(id).replace(/[^a-z0-9-]/gi, '--')}`;
}
