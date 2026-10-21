/**
 * Pares cointegrados sintéticos e a regra clássica de z-score, para o /lab/.
 *   X_t: passeio aleatório geométrico (vol diária volX).
 *   s_t: Ornstein-Uhlenbeck discreto, s_t = s_{t−1} − κ·s_{t−1} + σ_s·ε, com meia-vida h
 *        (κ = 1 − 2^(−1/h)) e desvio-padrão estacionário `noise`.
 *   Y_t = β·X_t + α + s_t.
 * A regra estima β por MQO na amostra toda (atenção: isso usa o futuro; num backtest de verdade
 * a estimativa é móvel, como no projeto pairs-trading), calcula o z-score móvel do spread e
 * opera: entra vendido no spread com z > entrada, comprado com z < −entrada, sai quando |z| < saída.
 */
import { mulberry32 } from './gbm.mjs';

function gaussFactory(rnd) {
  let spare = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    const u = 1 - rnd();
    const v = rnd();
    const m = Math.sqrt(-2 * Math.log(u));
    spare = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  };
}

export const kappaFromHalfLife = (h) => 1 - 2 ** (-1 / h);

export function simulatePair({ beta, halfLife, noise, days, seed, x0 = 50, alpha = 5, volX = 0.015 }) {
  const gauss = gaussFactory(mulberry32(seed));
  const kappa = kappaFromHalfLife(halfLife);
  // σ do choque para que o OU tenha desvio-padrão estacionário = noise.
  const shock = noise * Math.sqrt(1 - (1 - kappa) ** 2);
  const x = new Float64Array(days);
  const y = new Float64Array(days);
  let lx = Math.log(x0);
  let s = noise * gauss();
  for (let t = 0; t < days; t += 1) {
    if (t) {
      lx += volX * gauss();
      s = s - kappa * s + shock * gauss();
    }
    x[t] = Math.exp(lx);
    y[t] = beta * x[t] + alpha + s;
  }
  return { x, y };
}

/** MQO de y em x: y = a + b·x. */
export function ols(x, y) {
  const n = x.length;
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i += 1) {
    mx += x[i];
    my += y[i];
  }
  mx /= n;
  my /= n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i += 1) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  const b = sxy / sxx;
  return { a: my - b * mx, b };
}

/** Meia-vida estimada pelo AR(1) do spread: Δs_t = c + φ·s_{t−1}; h = −ln 2 / ln(1 + φ). */
export function estimateHalfLife(spread) {
  const prev = spread.subarray(0, spread.length - 1);
  const diff = new Float64Array(prev.length);
  for (let i = 0; i < prev.length; i += 1) diff[i] = spread[i + 1] - spread[i];
  const { b } = ols(prev, diff);
  return b < 0 && b > -1 ? -Math.LN2 / Math.log1p(b) : Infinity;
}

/** z-score móvel (janela `window`, desvio-padrão amostral); NaN antes de ter a janela cheia. */
export function rollingZ(series, window) {
  const n = series.length;
  const z = new Float64Array(n).fill(NaN);
  let sum = 0;
  let sum2 = 0;
  for (let i = 0; i < n; i += 1) {
    sum += series[i];
    sum2 += series[i] * series[i];
    if (i >= window) {
      sum -= series[i - window];
      sum2 -= series[i - window] * series[i - window];
    }
    if (i >= window - 1) {
      const mean = sum / window;
      const variance = Math.max((sum2 - window * mean * mean) / (window - 1), 0);
      const sd = Math.sqrt(variance);
      z[i] = sd > 0 ? (series[i] - mean) / sd : 0;
    }
  }
  return z;
}

/**
 * Regra de entrada/saída por z-score. Posição em unidades do spread: +1 comprado (compra Y,
 * vende β·X), −1 vendido. P&L acumulado = Σ posição_{t−1} · Δspread_t (sem custos).
 */
export function zScoreStrategy(spread, z, entry, exit) {
  const n = spread.length;
  const position = new Int8Array(n);
  const pnl = new Float64Array(n);
  const trades = [];
  let pos = 0;
  let open = null;
  for (let t = 0; t < n; t += 1) {
    if (t) pnl[t] = pnl[t - 1] + pos * (spread[t] - spread[t - 1]);
    const zt = z[t];
    if (!Number.isNaN(zt)) {
      if (pos === 0) {
        if (zt > entry) pos = -1;
        else if (zt < -entry) pos = 1;
        if (pos) open = { start: t, side: pos, entryPnl: pnl[t] };
      } else if (Math.abs(zt) < exit || (pos === 1 && zt > entry) || (pos === -1 && zt < -entry)) {
        // Sai na volta para perto de zero (ou se cruzar direto para o outro lado).
        trades.push({ ...open, end: t, pnl: pnl[t] - open.entryPnl });
        pos = 0;
        open = null;
      }
    }
    position[t] = pos;
  }
  if (open) trades.push({ ...open, end: n - 1, pnl: pnl[n - 1] - open.entryPnl, open: true });
  const closed = trades.filter((tr) => !tr.open);
  return {
    position,
    pnl,
    trades,
    stats: {
      trades: trades.length,
      hitRate: closed.length ? closed.filter((tr) => tr.pnl > 0).length / closed.length : NaN,
      totalPnl: pnl[n - 1],
      avgHolding: trades.length ? trades.reduce((a, tr) => a + (tr.end - tr.start), 0) / trades.length : 0,
    },
  };
}

/** Pipeline completo do demo. */
export function runPairsDemo({ beta, halfLife, noise, window, entry, exit, days = 500, seed = 1 }) {
  const { x, y } = simulatePair({ beta, halfLife, noise, days, seed });
  const fit = ols(x, y);
  const spread = new Float64Array(days);
  for (let t = 0; t < days; t += 1) spread[t] = y[t] - fit.b * x[t] - fit.a;
  const z = rollingZ(spread, window);
  const strat = zScoreStrategy(spread, z, entry, exit);
  return { x, y, spread, z, fit, halfLifeEstimate: estimateHalfLife(spread), ...strat };
}
