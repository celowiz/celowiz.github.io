/**
 * Fronteira eficiente de Markowitz, só posições compradas (pesos ≥ 0, somando 1), para 2 a 4
 * ativos sintéticos. Com tão poucos ativos dá para varrer o simplex numa grade fina (passo 1%:
 * no máximo 176.851 carteiras para 4 ativos) em vez de rodar um otimizador quadrático.
 */
import { mulberry32 } from './gbm.mjs';

/** Cholesky; retorna null se a matriz não for positiva definida. */
export function cholesky(m) {
  const n = m.length;
  const L = m.map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let s = m[i][j];
      for (let k = 0; k < j; k += 1) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (s <= 1e-10) return null;
        L[i][i] = Math.sqrt(s);
      } else {
        L[i][j] = s / L[j][j];
      }
    }
  }
  return L;
}

/**
 * Garante uma matriz de correlação válida (positiva definida). Se a informada não for, encolhe
 * as correlações em direção a zero (C' = (1 − λ)·C + λ·I) com o menor λ que resolve.
 */
export function makeValidCorrelation(corr) {
  const blend = (lambda) => corr.map((row, i) => row.map((v, j) => (i === j ? 1 : (1 - lambda) * v)));
  if (cholesky(corr)) return { corr, adjusted: false, lambda: 0 };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 50; i += 1) {
    const mid = (lo + hi) / 2;
    if (cholesky(blend(mid))) hi = mid;
    else lo = mid;
  }
  // Uma folga pequena para não ficar no limite numérico.
  const lambda = Math.min(1, hi + 0.01);
  return { corr: blend(lambda), adjusted: true, lambda };
}

export function covariance(vols, corr) {
  return vols.map((vi, i) => vols.map((vj, j) => vi * vj * corr[i][j]));
}

export function portfolioStats(w, mu, cov) {
  let ret = 0;
  let variance = 0;
  for (let i = 0; i < w.length; i += 1) {
    ret += w[i] * mu[i];
    for (let j = 0; j < w.length; j += 1) variance += w[i] * w[j] * cov[i][j];
  }
  return { ret, vol: Math.sqrt(Math.max(variance, 0)) };
}

/** Todas as carteiras da grade do simplex (passo 1/steps). */
function* simplexGrid(n, steps) {
  const w = new Array(n).fill(0);
  function* rec(i, left) {
    if (i === n - 1) {
      w[i] = left / steps;
      yield w;
      return;
    }
    for (let k = 0; k <= left; k += 1) {
      w[i] = k / steps;
      yield* rec(i + 1, left - k);
    }
  }
  yield* rec(0, steps);
}

/**
 * @param {{ mu: number[], vols: number[], corr: number[][], rf: number, randomCount?: number, seed?: number, steps?: number, bins?: number }} p
 */
export function efficientFrontier({ mu, vols, corr, rf, randomCount = 2500, seed = 1, steps = 100, bins = 80 }) {
  const valid = makeValidCorrelation(corr);
  const cov = covariance(vols, valid.corr);
  const n = mu.length;
  const minRet = Math.min(...mu);
  const maxRet = Math.max(...mu);
  const span = maxRet - minRet || 1;
  // Menor vol por faixa de retorno (curva da fronteira) + mínima variância e máximo Sharpe.
  const binVol = new Array(bins + 1).fill(Infinity);
  const binRet = new Array(bins + 1).fill(NaN);
  let minVar = { vol: Infinity, ret: 0, w: [] };
  let maxSharpe = { sharpe: -Infinity, vol: 0, ret: 0, w: [] };
  for (const w of simplexGrid(n, steps)) {
    const { ret, vol } = portfolioStats(w, mu, cov);
    const k = Math.round(((ret - minRet) / span) * bins);
    if (vol < binVol[k]) {
      binVol[k] = vol;
      binRet[k] = ret;
    }
    if (vol < minVar.vol) minVar = { vol, ret, w: [...w] };
    const sharpe = vol > 0 ? (ret - rf) / vol : -Infinity;
    if (sharpe > maxSharpe.sharpe) maxSharpe = { sharpe, vol, ret, w: [...w] };
  }
  const curve = [];
  for (let k = 0; k <= bins; k += 1) {
    if (Number.isFinite(binVol[k])) curve.push({ ret: binRet[k], vol: binVol[k], efficient: binRet[k] >= minVar.ret - 1e-12 });
  }
  // Carteiras aleatórias (Dirichlet(1): uniformes no simplex) para a nuvem de pontos.
  const rnd = mulberry32(seed);
  const random = new Float64Array(randomCount * 3); // vol, ret, sharpe
  const w = new Array(n);
  for (let r = 0; r < randomCount; r += 1) {
    let sum = 0;
    for (let i = 0; i < n; i += 1) {
      w[i] = -Math.log(1 - rnd());
      sum += w[i];
    }
    for (let i = 0; i < n; i += 1) w[i] /= sum;
    const s = portfolioStats(w, mu, cov);
    random[r * 3] = s.vol;
    random[r * 3 + 1] = s.ret;
    random[r * 3 + 2] = s.vol > 0 ? (s.ret - rf) / s.vol : 0;
  }
  return {
    curve,
    random,
    minVar: { ...minVar, sharpe: (minVar.ret - rf) / minVar.vol },
    maxSharpe,
    corr: valid.corr,
    adjusted: valid.adjusted,
    lambda: valid.lambda,
  };
}

/** Mínima variância de 2 ativos, fórmula fechada (para testes): peso no ativo 1, limitado a [0, 1]. */
export function minVarianceTwo(v1, v2, rho) {
  const c = rho * v1 * v2;
  const w = (v2 * v2 - c) / (v1 * v1 + v2 * v2 - 2 * c);
  return Math.min(1, Math.max(0, w));
}
