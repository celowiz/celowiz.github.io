// Formato de public/mercado-hoje.json (scripts/lib/mercado-hoje.mjs). Cada bloco é o
// data/summary.json do subprojeto, sem alteração.
export type Quad = 'L' | 'W' | 'G' | 'I';
export type Regime = 'queda' | 'lateral' | 'alta';

export interface Chip { t: string; chg: number | null; vr?: number | null; rsi?: number | null }
export interface SignalList { n: number; items: Chip[] }

export interface B3Summary {
  schema: number; as_of: string; generated_at: string; final: boolean; url: string;
  bench: { name: string; price: number; chg: number; ret21: number | null; ifix_proxy: string | null; ifix_chg: number | null; ifix_ret21: number | null };
  universe: { n: number; liq21_min_brl: number };
  breadth: { adv: number; dec: number; unch: number; above200: number; above50: number; highs: number; lows: number };
  signals: { high52: SignalList; low52: SignalList; golden: SignalList; death: SignalList; volume: SignalList; rsi_up: SignalList; rsi_down: SignalList };
  top: Chip[]; bottom: Chip[];
  us: { as_of: string; generated_at: string; final: boolean; bench: { price: number | null; chg: number | null; ret21: number | null } } | null;
}

export interface HmmMarket {
  label: string | null; date: string; px: number; regime: Regime; prob: number; since: string | null; names: Regime[];
  stats: Record<string, { vol_ann: number | null; ret_ann: number | null; exp_dur: number | null }>;
  hist: { from: string; to: string; regimes: Regime[] };
  k2?: { regime: Regime; since: string | null; date: string; prob: number };
}
export interface HmmSummary { schema: number; as_of: string; url: string; markets: { ibov?: HmmMarket; spx?: HmmMarket } }

export interface RrgItem { t: string; name: string | null; name_en: string | null; x: number; y: number; q: Quad; tx: (number | null)[]; ty: (number | null)[] }
export interface Quote { date: string; value: number; prev: number; chg: number }
export interface RrgSummary {
  schema: number; as_of: string; url: string;
  presets: { setbr?: { date: string; week_complete: boolean; n: number; tail: number; items: RrgItem[] } };
  quotes: { spx?: Quote; usdbrl?: Quote };
}

export interface Pair { id: string; ny: string; nx: string; z: number; hl: number | null; score: number | null; grade: string | null; state: string; tier: string }
export interface PairsSummary {
  schema: number; as_of: string; url: string; entry_z: number;
  funnel: { all_pairs: number; robust: number; cand: number };
  robust: Pair[]; cand: Pair[]; robust_outside: number;
}

export interface BcbItem { code: number; value: number; date: string; since?: string | null; prev?: number; prev_date?: string; chg?: number }
export interface BcbSummary {
  schema: number; as_of: string; url: string; source: string;
  series: { selic?: BcbItem; cdi?: BcbItem; ipca12?: BcbItem; ptax?: BcbItem };
}

export interface SetoresPick { t: string; pt: string; en: string; ret: number }
export interface SetoresMarket {
  as_of: string; stale: boolean; bench: string;
  /** pregão em andamento (dados parciais, com atraso) e horário da última cotação; ausentes em versões antigas */
  intraday?: boolean; as_of_ts?: string | null;
  day_base: string | null; ytd_base: string | null; day_bench: number | null; ytd_bench: number | null;
  day_leader: SetoresPick; day_laggard: SetoresPick; ytd_leader: SetoresPick; ytd_laggard: SetoresPick;
  sectors: { t: string; pt: string; en: string; day: number | null; ytd: number | null }[];
}
/** as_of do topo é acrescentado no sync (a data mais recente entre as abas). */
export interface SetoresSummary { schema: number; project: 'setores'; url: string; generated_at: string; as_of: string; us: SetoresMarket | null; br: SetoresMarket | null }

export type BlockKind = 'b3' | 'rrg' | 'hmm' | 'pairs' | 'setores' | 'bcb';
export interface MercadoHojeData {
  schema: number; generatedAt: string; as_of: string | null;
  sources: Partial<Record<BlockKind, { url: string; status: 'ok' | 'fallback' | 'partial' | 'missing'; as_of: string | null; kept?: string[] }>>;
  blocks: { b3: B3Summary | null; rrg: RrgSummary | null; hmm: HmmSummary | null; pairs: PairsSummary | null; setores?: SetoresSummary | null; bcb?: BcbSummary | null };
  text: { pt: string; en: string };
}
