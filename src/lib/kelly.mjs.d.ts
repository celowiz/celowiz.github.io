export type KellyParams = { p: number; b: number; f: number; bets: number; n: number; seed: number; keepPaths?: number; ruinLevel?: number };
export type KellyStats = { median: number; p5: number; p95: number; medianMaxDrawdown: number; probRuin: number; probLoss: number };
export type KellyResult = { times: Float64Array; quantiles: Float64Array; paths: Float64Array; keptPaths: number; stats: KellyStats };
export function kellyFraction(p: number, b: number): number;
export function growthRate(f: number, p: number, b: number): number;
export function zeroGrowthFraction(p: number, b: number): number;
export function simulateKelly(p: KellyParams): KellyResult;
