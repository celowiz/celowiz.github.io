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
  /** Cada demo é um chunk próprio, baixado só quando o visitante chega perto. */
  Component: LazyExoticComponent<ComponentType<DemoProps>>;
};

export const DEMOS: DemoDef[] = [
  { id: 'monte-carlo', key: 'monteCarlo', icon: ChartLine, repo: 'quant-notebooks', Component: lazy(() => import('./MonteCarloDemo')) },
  { id: 'frontier', key: 'frontier', icon: ChartScatter, repo: 'quant-notebooks', Component: lazy(() => import('./frontier/FrontierDemo')) },
  { id: 'pairs', key: 'pairs', icon: GitCompareArrows, repo: 'pairs-trading', Component: lazy(() => import('./pairs/PairsDemo')) },
  { id: 'kelly', key: 'kelly', icon: ChartPie, repo: 'monitor-b3', Component: lazy(() => import('./kelly/KellyDemo')) },
  { id: 'black-scholes', key: 'blackScholes', icon: Sigma, repo: 'quant-notebooks', Component: lazy(() => import('./black-scholes/BlackScholesDemo')) },
];

/** "#frontier" abre o demo; "#frontier-code" abre já com o código; "#code" é o do Monte Carlo. */
export function parseDemoHash(hash: string): { id: string; code: boolean } | null {
  if (hash === '#code') return { id: 'monte-carlo', code: true };
  const m = hash.match(/^#([a-z-]+?)(-code)?$/);
  if (!m) return null;
  const demo = DEMOS.find((d) => d.id === m[1]);
  return demo ? { id: demo.id, code: Boolean(m[2]) } : null;
}
