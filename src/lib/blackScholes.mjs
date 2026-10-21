/**
 * Black-Scholes-Merton para opções europeias, com dividend yield contínuo q.
 * Usado pelo demo do /lab/ e pelos testes. Greeks em unidades "por 1,00":
 * vega por 1,00 de vol (100 p.p.), theta por ano, rho por 1,00 de juro.
 */

/** erf com precisão ~1e-15 (série de Taylor perto de 0, fração contínua de erfc fora). */
export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  if (ax < 2.5) {
    // Série de Maclaurin: converge bem até |x| ≈ 3.
    let term = ax;
    let sum = ax;
    const x2 = ax * ax;
    for (let n = 1; n < 200; n += 1) {
      term *= -x2 / n;
      const add = term / (2 * n + 1);
      sum += add;
      if (Math.abs(add) < 1e-17 * Math.abs(sum)) break;
    }
    return sign * ((2 / Math.sqrt(Math.PI)) * sum);
  }
  // erfc(x) por fração contínua de Lentz.
  const tiny = 1e-300;
  let f = ax;
  let C = ax;
  let D = 0;
  for (let n = 1; n < 300; n += 1) {
    const a = n / 2;
    D = ax + a * D;
    D = D === 0 ? tiny : D;
    C = ax + a / C;
    C = C === 0 ? tiny : C;
    D = 1 / D;
    const delta = C * D;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-16) break;
  }
  const erfc = Math.exp(-ax * ax) / (f * Math.sqrt(Math.PI));
  return sign * (1 - erfc);
}

export const normPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
export const normCdf = (x) => 0.5 * (1 + erf(x / Math.SQRT2));

/**
 * @param {{ S: number, K: number, T: number, sigma: number, r: number, q?: number, type: 'call' | 'put' }} p
 */
export function bsPrice({ S, K, T, sigma, r, q = 0, type }) {
  if (T <= 0 || sigma <= 0) {
    // No vencimento (ou sem vol): valor intrínseco do forward descontado.
    const fwd = S * Math.exp(-q * Math.max(T, 0)) - K * Math.exp(-r * Math.max(T, 0));
    return type === 'call' ? Math.max(fwd, 0) : Math.max(-fwd, 0);
  }
  const { d1, d2 } = d12({ S, K, T, sigma, r, q });
  const dq = Math.exp(-q * T);
  const dr = Math.exp(-r * T);
  return type === 'call'
    ? S * dq * normCdf(d1) - K * dr * normCdf(d2)
    : K * dr * normCdf(-d2) - S * dq * normCdf(-d1);
}

export function d12({ S, K, T, sigma, r, q = 0 }) {
  const v = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + (sigma * sigma) / 2) * T) / v;
  return { d1, d2: d1 - v };
}

/** Greeks analíticos. theta por ano (divida por 365 para "por dia"). */
export function bsGreeks({ S, K, T, sigma, r, q = 0, type }) {
  const { d1, d2 } = d12({ S, K, T, sigma, r, q });
  const dq = Math.exp(-q * T);
  const dr = Math.exp(-r * T);
  const pdf = normPdf(d1);
  const sqrtT = Math.sqrt(T);
  const gamma = (dq * pdf) / (S * sigma * sqrtT);
  const vega = S * dq * pdf * sqrtT;
  const common = -(S * dq * pdf * sigma) / (2 * sqrtT);
  if (type === 'call') {
    return {
      delta: dq * normCdf(d1),
      gamma,
      vega,
      theta: common - r * K * dr * normCdf(d2) + q * S * dq * normCdf(d1),
      rho: K * T * dr * normCdf(d2),
    };
  }
  return {
    delta: -dq * normCdf(-d1),
    gamma,
    vega,
    theta: common + r * K * dr * normCdf(-d2) - q * S * dq * normCdf(-d1),
    rho: -K * T * dr * normCdf(-d2),
  };
}

export function payoff({ S, K, type }) {
  return type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
}
