// Mercado Hoje: junta os data/summary.json publicados pelos subprojetos (monitor-b3, rrg,
// hmm-regimes, pairs-trading) num único public/mercado-hoje.json e escreve o resumo do dia
// por regras fixas (sem IA). Nenhum número é calculado aqui além de contagens e datas: a
// lógica de cada indicador fica no projeto de origem.
export const SCHEMA = 1;
export const SITE = 'https://celowiz.github.io';
export const SOURCES = {
  b3: `${SITE}/monitor-b3/data/summary.json`,
  rrg: `${SITE}/rrg/data/summary.json`,
  hmm: `${SITE}/hmm-regimes/data/summary.json`,
  pairs: `${SITE}/pairs-trading/data/summary.json`,
  // Gerado no próprio deploy (scripts/fetch_bcb.py, python-bcb): arquivo local, não URL.
  bcb: '.cache/bcb-sgs.json',
};
export const BCB_SERIES = ['selic', 'cdi', 'ipca12', 'ptax'];
/** IPCA 12m é mensal (data = mês de referência, divulgado ~40 dias depois): tolera mais. */
export const ITEM_STALE_DAYS = { selic: 7, cdi: 7, ptax: 7, ipca12: 75 };
export const BLOCKS = Object.keys(SOURCES);
/** Um bloco com dados mais antigos que isso (dias corridos) some da página e do texto. */
export const STALE_DAYS = 7;

const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

/** Erros de formato de um summary.json (lista vazia = válido). */
export function validateBlock(kind, s) {
  const e = [];
  if (!s || typeof s !== 'object') return ['não é um objeto'];
  if (s.schema !== SCHEMA) e.push(`schema ${s.schema} (esperado ${SCHEMA})`);
  if (!isDate(s.as_of)) e.push('as_of ausente');
  if (kind === 'b3') {
    if (!s.bench || !isNum(s.bench.price) || !isNum(s.bench.chg)) e.push('bench incompleto');
    if (!s.universe || !isNum(s.universe.n) || s.universe.n <= 0) e.push('universo vazio');
    if (!s.breadth || !isNum(s.breadth.adv)) e.push('breadth ausente');
    if (!s.signals || !s.signals.high52) e.push('signals ausente');
  } else if (kind === 'hmm') {
    const m = s.markets ?? {};
    if (!m.ibov && !m.spx) e.push('nenhum mercado');
    for (const [k, v] of Object.entries(m)) {
      if (!v.regime || !Array.isArray(v.hist?.regimes)) e.push(`${k} incompleto`);
    }
  } else if (kind === 'rrg') {
    const p = s.presets?.setbr;
    if (!p || !Array.isArray(p.items) || !p.items.length) e.push('setbr ausente');
  } else if (kind === 'bcb') {
    const ser = s.series ?? {};
    const ok = BCB_SERIES.filter((k) => ser[k] && isNum(ser[k].value) && isDate(ser[k].date));
    if (!ok.length) e.push('nenhuma série válida');
  } else if (kind === 'pairs') {
    if (!s.funnel || !isNum(s.funnel.all_pairs)) e.push('funil ausente');
    if (!Array.isArray(s.robust)) e.push('robust ausente');
  }
  return e;
}

/** Dias corridos entre duas datas YYYY-MM-DD (b - a). */
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
}

/** Data de hoje em America/Sao_Paulo (YYYY-MM-DD). */
export function todayBrt(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);
}

export function isFresh(block, today) {
  return Boolean(block && isDate(block.as_of) && daysBetween(block.as_of, today) <= STALE_DAYS);
}

// ---------- texto por regras ----------
const SECTOR_SHORT = {
  pt: { IFNC: 'financeiro', IMAT: 'materiais básicos', ICON: 'consumo', IEEX: 'energia elétrica', UTIL: 'utilidade pública', IMOB: 'imobiliário', INDX: 'industrial' },
  en: { IFNC: 'financials', IMAT: 'basic materials', ICON: 'consumer', IEEX: 'electric power', UTIL: 'utilities', IMOB: 'real estate', INDX: 'industrials' },
};
export const REGIME = {
  pt: { queda: 'estresse', lateral: 'intermediário', alta: 'calmo' },
  en: { queda: 'stress', lateral: 'intermediate', alta: 'calm' },
};

export const sectorShort = (lang, t, fallback) => SECTOR_SHORT[lang][t] ?? fallback ?? t;
const pctAbs = (x, lang, d = 2) =>
  `${Math.abs(x * 100).toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
const dm = (s, lang) => (lang === 'en' ? `${s.slice(5, 7)}/${s.slice(8, 10)}` : `${s.slice(8, 10)}/${s.slice(5, 7)}`);
function list(items, lang) {
  const and = lang === 'en' ? 'and' : 'e';
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

/**
 * Resumo do dia em uma língua. Trechos entre **…** são destaques (a página pinta em teal).
 * Só usa blocos frescos; frase de cada bloco some se ele faltar. Sem opinião, sem previsão.
 */
export function summaryText(blocks, lang, today) {
  const en = lang === 'en';
  const out = [];
  const b3 = isFresh(blocks.b3, today) ? blocks.b3 : null;
  const hmm = isFresh(blocks.hmm, today) ? blocks.hmm : null;
  const rrg = isFresh(blocks.rrg, today) ? blocks.rrg : null;
  const pairs = isFresh(blocks.pairs, today) ? blocks.pairs : null;

  if (b3) {
    const { chg } = b3.bench;
    const d = dm(b3.as_of, lang);
    const adv = b3.breadth.adv;
    const n = b3.universe.n;
    const highs = b3.signals.high52.n;
    const flat = Math.abs(chg) < 0.00005;
    if (en) {
      const verb = flat ? 'was flat' : `${b3.final ? (chg > 0 ? 'rose' : 'fell') : chg > 0 ? 'is up' : 'is down'} **${pctAbs(chg, lang)}**`;
      out.push(`The Ibovespa ${verb} ${b3.final ? 'on' : 'so far on'} ${d}, with ${adv} of ${n} liquid stocks up and ${highs} new 52-week ${highs === 1 ? 'high' : 'highs'}.`);
    } else {
      const verb = flat ? 'ficou estável' : `${b3.final ? (chg > 0 ? 'subiu' : 'caiu') : chg > 0 ? 'sobe' : 'cai'} **${pctAbs(chg, lang)}**`;
      out.push(`O Ibovespa ${verb} ${b3.final ? 'em' : 'até agora no pregão de'} ${d}, com ${adv} de ${n} ações líquidas em alta e ${highs} ${highs === 1 ? 'nova máxima' : 'novas máximas'} de 52 semanas.`);
    }
  }
  const ib = hmm?.markets?.ibov;
  if (ib) {
    const name = REGIME[lang][ib.regime] ?? ib.regime;
    const at = !b3 || ib.date !== b3.as_of ? (en ? ` (close of ${dm(ib.date, lang)})` : ` (fechamento de ${dm(ib.date, lang)})`) : '';
    const since = ib.since ? (en ? ` since ${dm(ib.since, lang)}` : ` desde ${dm(ib.since, lang)}`) : '';
    out.push(
      en
        ? `The regime model classifies the index as **${name}**${since}${at}.`
        : `O modelo de regimes classifica o índice como **${name}**${since}${at}.`
    );
  }
  const st = rrg?.presets?.setbr;
  if (st) {
    const lead = st.items.filter((i) => i.q === 'L').length;
    const lag = st.items.filter((i) => i.q === 'G').map((i) => sectorShort(lang, i.t, en ? i.name_en : i.name));
    let s = en
      ? `In the weekly rotation, ${lead} of ${st.items.length} sectors are leading`
      : `Na rotação semanal, ${lead} de ${st.items.length} setores estão em liderança`;
    if (lag.length) s += en ? `; ${list(lag, lang)} ${lag.length === 1 ? 'is' : 'are'} lagging` : `; ${list(lag, lang)} ${lag.length === 1 ? 'segue' : 'seguem'} em defasagem`;
    out.push(`${s}.`);
  }
  const ser = blocks.bcb?.series ?? {};
  const selic = isItemFresh('selic', ser.selic, today) ? ser.selic : null;
  const ipca = isItemFresh('ipca12', ser.ipca12, today) ? ser.ipca12 : null;
  if (selic || ipca) {
    const n2 = (x) => x.toLocaleString(en ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const month = (d) => new Intl.DateTimeFormat(en ? 'en-US' : 'pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));
    const parts = [];
    if (selic) parts.push(en ? `the Selic target ${selic.since ? 'has been' : 'is'} ${n2(selic.value)}% p.a.${selic.since ? ` since ${dm(selic.since, lang)}` : ''}` : `a meta da Selic está em ${n2(selic.value)}% a.a.${selic.since ? ` desde ${dm(selic.since, lang)}` : ''}`);
    if (ipca) parts.push(en ? `12-month IPCA inflation through ${month(ipca.date)} was ${n2(ipca.value)}%` : `o IPCA de 12 meses até ${month(ipca.date)} foi de ${n2(ipca.value)}%`);
    const txt = parts.join(en ? ', and ' : ' e ');
    out.push(`${en ? 'According to the Central Bank' : 'Segundo o Banco Central'}, ${txt}.`);
  }
  if (pairs && pairs.robust_outside > 0) {
    const k = pairs.robust_outside;
    out.push(
      en
        ? `${k} robust cointegrated ${k === 1 ? 'pair is' : 'pairs are'} beyond ±2σ of the historical spread.`
        : `${k} ${k === 1 ? 'par cointegrado robusto está' : 'pares cointegrados robustos estão'} além de ±2σ do spread histórico.`
    );
  }
  return out.join(' ');
}

/**
 * Monta o payload final. fetched: {kind: summary | Error}; previous: payload anterior válido
 * (do site no ar ou o versionado) para o fallback por bloco.
 */
export function buildPayload(fetched, previous, now = new Date()) {
  const today = todayBrt(now);
  const blocks = {};
  const sources = {};
  for (const kind of BLOCKS) {
    const got = fetched[kind];
    const errors = got instanceof Error ? [got.message] : validateBlock(kind, got);
    if (kind === 'bcb') {
      const merged = mergeBcb(errors.length ? null : got, previous?.blocks?.bcb);
      blocks.bcb = merged.block;
      sources.bcb = { url: 'https://www3.bcb.gov.br/sgspub/', status: merged.status, as_of: merged.block?.as_of ?? null, ...(errors.length ? { error: errors.join('; ') } : {}), ...(merged.kept.length ? { kept: merged.kept } : {}) };
      continue;
    }
    if (!errors.length) {
      blocks[kind] = got;
      sources[kind] = { url: SOURCES[kind], status: 'ok', as_of: got.as_of };
      continue;
    }
    const prev = previous?.blocks?.[kind];
    if (prev && !validateBlock(kind, prev).length) {
      blocks[kind] = prev;
      sources[kind] = { url: SOURCES[kind], status: 'fallback', as_of: prev.as_of, error: errors.join('; ') };
    } else {
      blocks[kind] = null;
      sources[kind] = { url: SOURCES[kind], status: 'missing', as_of: null, error: errors.join('; ') };
    }
  }
  const dates = BLOCKS.map((k) => blocks[k]?.as_of).filter(isDate).sort();
  return {
    schema: SCHEMA,
    generatedAt: now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    as_of: blocks.b3?.as_of ?? dates[dates.length - 1] ?? null,
    sources,
    blocks,
    text: { pt: summaryText(blocks, 'pt', today), en: summaryText(blocks, 'en', today) },
  };
}

/** Série a série: o que veio novo e válido entra; o que faltar fica com o último valor publicado. */
export function mergeBcb(got, prev) {
  const series = {};
  const kept = [];
  for (const k of BCB_SERIES) {
    const n = got?.series?.[k];
    const o = prev?.series?.[k];
    if (n && isNum(n.value) && isDate(n.date)) series[k] = n;
    else if (o && isNum(o.value) && isDate(o.date)) {
      series[k] = o;
      kept.push(k);
    }
  }
  const keys = Object.keys(series);
  if (!keys.length) return { block: null, status: 'missing', kept };
  const daily = keys.filter((k) => k !== 'ipca12').map((k) => series[k].date).sort();
  const base = got ?? prev;
  return {
    block: { ...base, series, as_of: daily[daily.length - 1] ?? series.ipca12.date },
    status: !got ? 'fallback' : kept.length ? 'partial' : 'ok',
    kept,
  };
}

export function isItemFresh(key, item, today) {
  return Boolean(item && isDate(item.date) && daysBetween(item.date, today) <= (ITEM_STALE_DAYS[key] ?? STALE_DAYS));
}

export function validatePayload(p) {
  if (!p || p.schema !== SCHEMA || !p.blocks) return ['payload inválido'];
  return BLOCKS.some((k) => p.blocks[k]) ? [] : ['nenhum bloco com dados'];
}
