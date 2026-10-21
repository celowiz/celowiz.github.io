export type FrontierPoint = { ret: number; vol: number; w: number[]; sharpe: number };
export type FrontierResult = {
  curve: { ret: number; vol: number; efficient: boolean }[];
  /** randomCount × [vol, ret, sharpe]. */
  random: Float64Array;
  minVar: FrontierPoint;
  maxSharpe: FrontierPoint;
  corr: number[][];
  adjusted: boolean;
  lambda: number;
};
export function cholesky(m: number[][]): number[][] | null;
export function makeValidCorrelation(corr: number[][]): { corr: number[][]; adjusted: boolean; lambda: number };
export function covariance(vols: number[], corr: number[][]): number[][];
export function portfolioStats(w: number[], mu: number[], cov: number[][]): { ret: number; vol: number };
export function efficientFrontier(p: {
  mu: number[];
  vols: number[];
  corr: number[][];
  rf: number;
  randomCount?: number;
  seed?: number;
  steps?: number;
  bins?: number;
}): FrontierResult;
export function minVarianceTwo(v1: number, v2: number, rho: number): number;
