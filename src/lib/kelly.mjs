/**
 * Critério de Kelly para uma aposta repetida: ganha b por unidade apostada com probabilidade p,
 * perde a unidade com probabilidade 1 − p. Apostando a fração f da riqueza a cada rodada:
 *   g(f) = p·ln(1 + f·b) + (1 − p)·ln(1 − f)   (crescimento esperado do log da riqueza)
 *   f*   = p − (1 − p)/b                        (máximo de g)
 */
import { QUANTILES, mulberry32, quantileSorted } from './gbm.mjs';

export function kellyFraction(p, b) {
  return p - (1 - p) / b;
}

export function growthRate(f, p, b) {
  if (f >= 1) return -Infinity;
  if (f <= -1 / b) return -Infinity;
  return p * Math.log1p(f * b) + (1 - p) * Math.log1p(-f);
}

/** Outra raiz de g(f) = 0 (além de f = 0), por bisseção entre f* e 1: a partir dela a riqueza encolhe. */
export function zeroGrowthFraction(p, b) {
  const fStar = kellyFraction(p, b);
  if (fStar <= 0) return 0;
  let lo = fStar;
  let hi = 1 - 1e-12;
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2;
    if (growthRate(mid, p, b) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Monte Carlo da riqueza (começa em 1) apostando a fração f por `bets` rodadas.
 * Retorna percentis por rodada (P5, P25, P50, P75, P95), algumas trajetórias e estatísticas.
 * Memória O(n): anda rodada a rodada, como o Monte Carlo de preços.
 */
export function simulateKelly({ p, b, f, bets, n, seed, keepPaths = 30, ruinLevel = 0.1 }) {
  const rnd = mulberry32(seed);
  const wealth = new Float64Array(n).fill(1);
  const peak = new Float64Array(n).fill(1);
  const maxDd = new Float64Array(n);
  const ruined = new Uint8Array(n);
  const step = Math.max(1, Math.floor(bets / 150));
  const times = [];
  for (let t = 0; t <= bets; t += step) times.push(t);
  if (times[times.length - 1] !== bets) times.push(bets);
  const K = QUANTILES.length;
  const quantiles = new Float64Array(times.length * K);
  const kept = Math.min(keepPaths, n);
  const paths = new Float64Array(kept * times.length);
  const scratch = new Float64Array(n);
  const record = (j) => {
    scratch.set(wealth);
    scratch.sort();
    for (let k = 0; k < K; k += 1) quantiles[j * K + k] = quantileSorted(scratch, QUANTILES[k]);
    for (let i = 0; i < kept; i += 1) paths[i * times.length + j] = wealth[i];
  };
  record(0);
  let next = 1;
  const up = 1 + f * b;
  const down = 1 - f;
  for (let t = 1; t <= bets; t += 1) {
    for (let i = 0; i < n; i += 1) {
      const w = (wealth[i] *= rnd() < p ? up : down);
      if (w > peak[i]) peak[i] = w;
      const dd = 1 - w / peak[i];
      if (dd > maxDd[i]) maxDd[i] = dd;
      if (w < ruinLevel) ruined[i] = 1;
    }
    if (t === times[next]) {
      record(next);
      next += 1;
    }
  }
  const finals = Float64Array.from(wealth).sort();
  const dds = Float64Array.from(maxDd).sort();
  let ruinCount = 0;
  let lossCount = 0;
  for (let i = 0; i < n; i += 1) {
    ruinCount += ruined[i];
    if (wealth[i] < 1) lossCount += 1;
  }
  return {
    times: Float64Array.from(times),
    quantiles,
    paths,
    keptPaths: kept,
    stats: {
      median: quantileSorted(finals, 0.5),
      p5: quantileSorted(finals, 0.05),
      p95: quantileSorted(finals, 0.95),
      medianMaxDrawdown: quantileSorted(dds, 0.5),
      probRuin: ruinCount / n,
      probLoss: lossCount / n,
    },
  };
}
