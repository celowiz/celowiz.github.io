import type { BlockKind, MercadoHojeData, SetoresMarket, SetoresSummary } from '../types/MercadoHoje';

/** Igual a scripts/lib/mercado-hoje.mjs: blocos com dados mais velhos que isso não aparecem. */
export const STALE_DAYS = 7;

export const todayBrt = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

export function freshBlocks(data: MercadoHojeData, today = todayBrt()) {
  const ok = (k: BlockKind) => {
    const b = data.blocks[k];
    return b && typeof b.as_of === 'string' && daysBetween(b.as_of, today) <= STALE_DAYS ? b : null;
  };
  return { b3: ok('b3') as MercadoHojeData['blocks']['b3'], rrg: ok('rrg') as MercadoHojeData['blocks']['rrg'], hmm: ok('hmm') as MercadoHojeData['blocks']['hmm'], pairs: ok('pairs') as MercadoHojeData['blocks']['pairs'], setores: freshSetores(data.blocks.setores, today) };
}

/** Setores: cada aba (EUA, Brasil) segue a regra dos 7 dias pela própria data; sem aba fresca, o bloco some. */
export function freshSetores(s: SetoresSummary | null | undefined, today = todayBrt()) {
  if (!s) return null;
  const ok = (m: SetoresMarket | null | undefined) => (m && typeof m.as_of === 'string' && daysBetween(m.as_of, today) <= STALE_DAYS ? m : null);
  const us = ok(s.us);
  const br = ok(s.br);
  return us || br ? { ...s, us, br } : null;
}

export function makeFmt(lang: string) {
  const loc = lang.startsWith('en') ? 'en-US' : 'pt-BR';
  const en = loc === 'en-US';
  const nf = (d: number) => new Intl.NumberFormat(loc, { minimumFractionDigits: d, maximumFractionDigits: d });
  return {
    en,
    num: (x: number, d = 0) => nf(d).format(x),
    /** sinal explícito (+/−) por padrão */
    pct: (x: number, d = 1, sign = true) => `${sign && x > 0 ? '+' : x < 0 ? '−' : ''}${nf(d).format(Math.abs(x * 100))}%`,
    /** dd/mm (pt) ou mm/dd (en) */
    dm: (s: string) => (en ? `${s.slice(5, 7)}/${s.slice(8, 10)}` : `${s.slice(8, 10)}/${s.slice(5, 7)}`),
    longDate: (s: string) =>
      new Intl.DateTimeFormat(loc, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${s}T12:00:00Z`)),
    timeBrt: (iso: string) =>
      new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(new Date(iso)),
  };
}
export type Fmt = ReturnType<typeof makeFmt>;

export const tone = (x: number | null | undefined) => (x == null || x === 0 ? 'text-paper/55' : x > 0 ? 'text-teal' : 'text-[#f97366]');
