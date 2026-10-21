/**
 * Monte Carlo de preços com movimento browniano geométrico (GBM), em JavaScript puro.
 *
 * Usado pelo Web Worker do /lab/ (src/lab/mc.worker.ts) e pelos testes (node --test).
 * Em vez de guardar a matriz N × dias inteira (~15 MB com 5.000 trajetórias de 3 anos), a
 * simulação anda dia a dia com um vetor de N preços e só tira os percentis nos dias que vão
 * para o gráfico. Memória: O(N) + as ~40 trajetórias desenhadas.
 */

export const TRADING_DAYS = 252;
export const QUANTILES = [0.05, 0.25, 0.5, 0.75, 0.95];

/** PRNG mulberry32: rápido, 32 bits, determinístico por semente. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semente própria de cada trajetória: aumentar N não muda as trajetórias que já existiam. */
function pathSeed(seed, i) {
  let h = Math.imul((seed >>> 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(i + 1, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Percentil por posição (mesma regra do mock): valor ordenado em floor(q·(n−1)). */
export function quantileSorted(sorted, q) {
  return sorted[Math.floor(q * (sorted.length - 1))];
}

/** Dias que entram no gráfico: no máximo ~maxPoints + o último dia. */
export function sampleDays(days, maxPoints = 120) {
  const step = Math.max(1, Math.floor(days / maxPoints));
  const out = [];
  for (let t = 0; t <= days; t += step) out.push(t);
  if (out[out.length - 1] !== days) out.push(days);
  return out;
}

/**
 * @param {{ s0: number, mu: number, sigma: number, days: number, n: number, seed: number, keepPaths?: number }} p
 *   mu e sigma anuais (0.1 = 10%); days em pregões.
 */
export function simulateGbm({ s0, mu, sigma, days, n, seed, keepPaths = 40 }) {
  const dt = 1 / TRADING_DAYS;
  const drift = (mu - (sigma * sigma) / 2) * dt;
  const vol = sigma * Math.sqrt(dt);
  const times = sampleDays(days);
  const kept = Math.min(keepPaths, n);

  // Estado: preço atual e semente de cada trajetória (Box-Muller com par guardado).
  const price = new Float64Array(n).fill(s0);
  const rngState = new Uint32Array(n);
  const spare = new Float64Array(n);
  const hasSpare = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) rngState[i] = pathSeed(seed, i);

  const quantiles = new Float64Array(times.length * QUANTILES.length);
  const paths = new Float64Array(kept * times.length);
  const scratch = new Float64Array(n);

  const record = (j) => {
    scratch.set(price);
    scratch.sort();
    for (let k = 0; k < QUANTILES.length; k += 1) {
      quantiles[j * QUANTILES.length + k] = quantileSorted(scratch, QUANTILES[k]);
    }
    for (let i = 0; i < kept; i += 1) paths[i * times.length + j] = price[i];
  };

  record(0);
  let next = 1;
  for (let t = 1; t <= days; t += 1) {
    for (let i = 0; i < n; i += 1) {
      let z;
      if (hasSpare[i]) {
        z = spare[i];
        hasSpare[i] = 0;
      } else {
        // mulberry32 inline com o estado da trajetória i.
        let a = rngState[i];
        a = (a + 0x6d2b79f5) >>> 0;
        let x = Math.imul(a ^ (a >>> 15), a | 1);
        x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
        const u1 = (((x ^ (x >>> 14)) >>> 0) + 1) / 4294967297; // (0, 1): sem log(0)
        a = (a + 0x6d2b79f5) >>> 0;
        x = Math.imul(a ^ (a >>> 15), a | 1);
        x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
        const u2 = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
        rngState[i] = a;
        const m = Math.sqrt(-2 * Math.log(u1));
        z = m * Math.cos(2 * Math.PI * u2);
        spare[i] = m * Math.sin(2 * Math.PI * u2);
        hasSpare[i] = 1;
      }
      price[i] *= Math.exp(drift + vol * z);
    }
    if (t === times[next]) {
      record(next);
      next += 1;
    }
  }

  // price agora guarda S_T de cada trajetória.
  let sum = 0;
  let below = 0;
  for (let i = 0; i < n; i += 1) {
    sum += price[i];
    if (price[i] < s0) below += 1;
  }
  const finals = Float64Array.from(price).sort();

  return {
    times: Float64Array.from(times),
    quantiles,
    paths,
    keptPaths: kept,
    finals,
    stats: {
      median: quantileSorted(finals, 0.5),
      mean: sum / n,
      p5: quantileSorted(finals, 0.05),
      p95: quantileSorted(finals, 0.95),
      probBelow: below / n,
    },
  };
}

/** Valores teóricos do GBM (para conferir a simulação e para o texto explicativo). */
export function gbmTheory({ s0, mu, sigma, days }) {
  const T = days / TRADING_DAYS;
  return { mean: s0 * Math.exp(mu * T), median: s0 * Math.exp((mu - (sigma * sigma) / 2) * T) };
}

/** Histograma de valores ordenados entre o mínimo e o P99 (cauda acima do P99 fica de fora). */
export function histogram(sortedFinals, bins = 40) {
  const lo = sortedFinals[0];
  const hi = quantileSorted(sortedFinals, 0.99);
  const counts = new Array(bins).fill(0);
  const width = (hi - lo) / bins || 1;
  for (const v of sortedFinals) {
    if (v > hi) break;
    counts[Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / width)))] += 1;
  }
  return { lo, hi, width, counts };
}
