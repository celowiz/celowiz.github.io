import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { ChartLine, ChartPie, ChartScatter, GitCompareArrows, Sigma, type LucideIcon } from 'lucide-react';

export type OpenTrigger = 'click' | 'scroll' | 'hash';
export type DemoProps = { trigger: OpenTrigger; initialCode?: boolean };

export type DemoDef = {
  /** Âncora e id do GA4 (/lab/#id). */
  id: string;
  /** Chave dos textos em lab.demos.items. */
  key: string;
  icon: LucideIcon;
  repo: string;
  /** Altura reservada (medida no render) para o deep link não deslocar o layout. */
  minH: string;
  minHCode: string;
  /** Cada demo é um chunk próprio, baixado só quando o visitante chega perto. */
  Component: LazyExoticComponent<ComponentType<DemoProps>>;
};

export const DEMOS: DemoDef[] = [
  {
    id: 'monte-carlo',
    minH: 'min-h-[1585px] sm:min-h-[1491px] md:min-h-[1340px] lg:min-h-[749px]',
    minHCode: 'min-h-[2430px] sm:min-h-[2257px] md:min-h-[1833px] lg:min-h-[1242px]',
    key: 'monteCarlo',
    icon: ChartLine,
    repo: 'quant-notebooks',
    Component: lazy(() => import('./MonteCarloDemo')),
  },
  {
    id: 'frontier',
    minH: 'min-h-[2279px] sm:min-h-[2123px] md:min-h-[1932px] lg:min-h-[1142px]',
    minHCode: 'min-h-[2953px] sm:min-h-[2773px] md:min-h-[2321px] lg:min-h-[1233px]',
    key: 'frontier',
    icon: ChartScatter,
    repo: 'quant-notebooks',
    Component: lazy(() => import('./frontier/FrontierDemo')),
  },
  {
    id: 'pairs',
    minH: 'min-h-[2001px] sm:min-h-[1946px] md:min-h-[1810px] lg:min-h-[1112px]',
    minHCode: 'min-h-[2702px] sm:min-h-[2622px] md:min-h-[2240px] lg:min-h-[1542px]',
    key: 'pairs',
    icon: GitCompareArrows,
    repo: 'pairs-trading',
    Component: lazy(() => import('./pairs/PairsDemo')),
  },
  {
    id: 'kelly',
    minH: 'min-h-[1675px] sm:min-h-[1632px] md:min-h-[1457px] lg:min-h-[773px]',
    minHCode: 'min-h-[2361px] sm:min-h-[2260px] md:min-h-[1867px] lg:min-h-[1183px]',
    key: 'kelly',
    icon: ChartPie,
    repo: 'quant-notebooks',
    Component: lazy(() => import('./kelly/KellyDemo')),
  },
  {
    id: 'black-scholes',
    minH: 'min-h-[1910px] sm:min-h-[1843px] md:min-h-[1661px] lg:min-h-[879px]',
    minHCode: 'min-h-[2639px] sm:min-h-[2561px] md:min-h-[2133px] lg:min-h-[1259px]',
    key: 'blackScholes',
    icon: Sigma,
    repo: 'quant-notebooks',
    Component: lazy(() => import('./black-scholes/BlackScholesDemo')),
  },
];

/** "#frontier" abre o demo; "#frontier-code" abre já com o código; "#code" é o do Monte Carlo. */
export function parseDemoHash(hash: string): { id: string; code: boolean } | null {
  if (hash === '#code') return { id: 'monte-carlo', code: true };
  const m = hash.match(/^#([a-z-]+?)(-code)?$/);
  if (!m) return null;
  const demo = DEMOS.find((d) => d.id === m[1]);
  return demo ? { id: demo.id, code: Boolean(m[2]) } : null;
}
