import type { ReactNode } from 'react';

// Versão resumida de src/lib/gbm.mjs (a simulação que roda no worker), para o "Ver código".
const body = (c: Record<string, string>) => `// gbm.mjs — ${c.head}
export function simulateGbm({ s0, mu, sigma, days, n, seed }) {
  const dt = 1 / 252;
  const drift = (mu - sigma ** 2 / 2) * dt;
  const vol = sigma * Math.sqrt(dt);
  // ${c.vector}
  const price = new Float64Array(n).fill(s0);
  // ${c.rng}
  const rng = pathRngs(seed, n);
  const fan = [percentiles(price)];
  for (let t = 1; t <= days; t++) {
    for (let i = 0; i < n; i++) {
      const z = gauss(rng[i]); // Box-Muller
      price[i] *= Math.exp(drift + vol * z);
    }
    // ${c.pct}
    if (isCharted(t)) fan.push(percentiles(price));
  }
  // ${c.ret}
  return { fan, finals: price.sort() };
}`;

export const CODE = {
  pt: body({
    head: 'roda num Web Worker, sem dependências',
    vector: 'só N preços na memória, não a matriz N × dias',
    rng: 'um PRNG por trajetória (N maior mantém as antigas)',
    pct: 'P5, P25, P50, P75 e P95 só nos dias do gráfico',
    ret: 'leque + histograma do preço final',
  }),
  en: body({
    head: 'runs in a Web Worker, no dependencies',
    vector: 'only N prices in memory, not the N × days matrix',
    rng: 'one PRNG per path (a bigger N keeps the old ones)',
    pct: 'P5, P25, P50, P75 and P95 only on charted days',
    ret: 'fan + final price histogram',
  }),
};

const TOKENS = /(\/\/.*$)|\b(export|function|const|let|for|if|return|new)\b|\b(\d+(?:\.\d+)?)\b/gm;

/** Realce mínimo: comentários, palavras-chave e números. */
export function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of code.matchAll(TOKENS)) {
    const i = m.index ?? 0;
    if (i > last) out.push(code.slice(last, i));
    const cls = m[1] ? 'tok-c' : m[2] ? 'tok-k' : 'tok-n';
    out.push(
      <span key={i} className={cls}>
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  out.push(code.slice(last));
  return out;
}
