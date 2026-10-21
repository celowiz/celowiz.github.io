export type Trade = { start: number; end: number; side: number; pnl: number; entryPnl: number; open?: boolean };
export type PairsStats = { trades: number; hitRate: number; totalPnl: number; avgHolding: number };
export function kappaFromHalfLife(h: number): number;
export function simulatePair(p: { beta: number; halfLife: number; noise: number; days: number; seed: number; x0?: number; alpha?: number; volX?: number }): { x: Float64Array; y: Float64Array };
export function ols(x: ArrayLike<number>, y: ArrayLike<number>): { a: number; b: number };
export function estimateHalfLife(spread: Float64Array): number;
export function rollingZ(series: ArrayLike<number>, window: number): Float64Array;
export function zScoreStrategy(spread: ArrayLike<number>, z: ArrayLike<number>, entry: number, exit: number): {
  position: Int8Array;
  pnl: Float64Array;
  trades: Trade[];
  stats: PairsStats;
};
export function runPairsDemo(p: { beta: number; halfLife: number; noise: number; window: number; entry: number; exit: number; days?: number; seed?: number }): {
  x: Float64Array;
  y: Float64Array;
  spread: Float64Array;
  z: Float64Array;
  fit: { a: number; b: number };
  halfLifeEstimate: number;
  position: Int8Array;
  pnl: Float64Array;
  trades: Trade[];
  stats: PairsStats;
};
