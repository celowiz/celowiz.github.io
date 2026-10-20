export interface SecondBrainSub {
  id: string;
  emoji: string;
  /** Vazio quando a categoria não tem subcategorias no README. */
  name: string;
}

export interface SecondBrainCategory {
  id: string;
  emoji: string;
  name: string;
  subs: SecondBrainSub[];
}

export interface SecondBrainItem {
  /** nome */
  n: string;
  /** url */
  u: string;
  /** domínio */
  d: string;
  /** descrição */
  x: string;
  /** id da categoria */
  c: string;
  /** id da subcategoria */
  s: string;
  /** flags de status (bot, archived, login…) */
  f: string[];
  /** 1 quando é subitem de outro link */
  lvl: number;
}

export interface SecondBrainData {
  version: number;
  generatedAt: string;
  source: { repo: string; file: string; commit?: string };
  counts: { links: number; categories: number; subcategories: number };
  categories: SecondBrainCategory[];
  items: SecondBrainItem[];
}
