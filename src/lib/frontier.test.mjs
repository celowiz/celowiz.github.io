import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cholesky, efficientFrontier, makeValidCorrelation, minVarianceTwo, portfolioStats, covariance } from './frontier.mjs';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} vs ${b}`);

describe('Fronteira eficiente do /lab/', () => {
  it('2 ativos: mínima variância bate com a fórmula fechada', () => {
    const r = efficientFrontier({ mu: [0.06, 0.12], vols: [0.1, 0.25], corr: [[1, 0.2], [0.2, 1]], rf: 0.02 });
    close(r.minVar.w[0], minVarianceTwo(0.1, 0.25, 0.2), 0.006);
    close(r.minVar.w[0] + r.minVar.w[1], 1, 1e-12);
  });

  it('2 ativos: máximo Sharpe bate com a tangente analítica (sem restrição ativa)', () => {
    const mu = [0.06, 0.12];
    const v = [0.1, 0.25];
    const rho = 0.2;
    const rf = 0.02;
    const r = efficientFrontier({ mu, vols: v, corr: [[1, rho], [rho, 1]], rf });
    // w ∝ Σ⁻¹(μ − rf)
    const c = rho * v[0] * v[1];
    const e = [mu[0] - rf, mu[1] - rf];
    const det = v[0] ** 2 * v[1] ** 2 - c * c;
    const raw = [(v[1] ** 2 * e[0] - c * e[1]) / det, (-c * e[0] + v[0] ** 2 * e[1]) / det];
    const w0 = raw[0] / (raw[0] + raw[1]);
    close(r.maxSharpe.w[0], w0, 0.006);
  });

  it('correlação perfeita negativa com 2 ativos zera a vol da mínima variância', () => {
    const corr = [[1, -0.999999], [-0.999999, 1]];
    const valid = makeValidCorrelation(corr);
    const r = efficientFrontier({ mu: [0.05, 0.1], vols: [0.2, 0.2], corr: valid.corr, rf: 0 });
    assert.ok(r.minVar.vol < 0.01, String(r.minVar.vol));
  });

  it('correlações impossíveis são ajustadas até a matriz ficar positiva definida', () => {
    // A~B e A~C muito positivas, mas B~C muito negativa: não existe.
    const bad = [[1, 0.9, 0.9], [0.9, 1, -0.9], [0.9, -0.9, 1]];
    assert.equal(cholesky(bad), null);
    const fixed = makeValidCorrelation(bad);
    assert.equal(fixed.adjusted, true);
    assert.ok(cholesky(fixed.corr));
    assert.ok(fixed.lambda > 0 && fixed.lambda < 1);
    const ok = makeValidCorrelation([[1, 0.3], [0.3, 1]]);
    assert.equal(ok.adjusted, false);
  });

  it('4 ativos: fronteira não fica à esquerda de nenhuma carteira aleatória', () => {
    const corr = [
      [1, 0.2, 0.1, 0.3],
      [0.2, 1, 0.5, 0.4],
      [0.1, 0.5, 1, 0.6],
      [0.3, 0.4, 0.6, 1],
    ];
    const r = efficientFrontier({ mu: [0.06, 0.1, 0.14, 0.12], vols: [0.08, 0.18, 0.28, 0.22], corr, rf: 0.03, randomCount: 500 });
    const curveAt = (ret) => {
      let best = Infinity;
      for (const c of r.curve) if (Math.abs(c.ret - ret) < 0.002) best = Math.min(best, c.vol);
      return best;
    };
    for (let i = 0; i < 500; i += 1) {
      const vol = r.random[i * 3];
      const ret = r.random[i * 3 + 1];
      assert.ok(curveAt(ret) <= vol + 0.004, `ret ${ret} vol ${vol} curva ${curveAt(ret)}`);
      assert.ok(r.random[i * 3 + 2] <= r.maxSharpe.sharpe + 0.01);
    }
    const s = portfolioStats(r.maxSharpe.w, [0.06, 0.1, 0.14, 0.12], covariance([0.08, 0.18, 0.28, 0.22], corr));
    close(s.ret, r.maxSharpe.ret, 1e-12);
  });
});
