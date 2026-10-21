export const TRADING_DAYS: 252;
export const QUANTILES: number[];

export type GbmParams = {
  s0: number;
  /** Drift anual (0.1 = 10%). */
  mu: number;
  /** Volatilidade anual (0.3 = 30%). */
  sigma: number;
  /** Horizonte em pregões. */
  days: number;
  n: number;
  seed: number;
  keepPaths?: number;
};

export type GbmStats = { median: number; mean: number; p5: number; p95: number; probBelow: number };

export type GbmResult = {
  times: Float64Array;
  /** times.length × QUANTILES.length, linha por dia amostrado. */
  quantiles: Float64Array;
  /** keptPaths × times.length. */
  paths: Float64Array;
  keptPaths: number;
  finals: Float64Array;
  stats: GbmStats;
};

export function mulberry32(seed: number): () => number;
export function quantileSorted(sorted: ArrayLike<number>, q: number): number;
export function sampleDays(days: number, maxPoints?: number): number[];
export function simulateGbm(params: GbmParams): GbmResult;
export function gbmTheory(params: Pick<GbmParams, 's0' | 'mu' | 'sigma' | 'days'>): { mean: number; median: number };
export function histogram(
  sortedFinals: ArrayLike<number>,
  bins?: number,
): { lo: number; hi: number; width: number; counts: number[] };
