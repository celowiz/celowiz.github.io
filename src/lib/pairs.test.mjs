import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateHalfLife, kappaFromHalfLife, ols, rollingZ, runPairsDemo, simulatePair, zScoreStrategy } from './pairs.mjs';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} vs ${b}`);

describe('Pares cointegrados do /lab/', () => {
  it('κ da meia-vida: metade do desvio some em h dias', () => {
    close((1 - kappaFromHalfLife(10)) ** 10, 0.5, 1e-12);
  });

  it('MQO recupera β e a meia-vida estimada fica perto da verdadeira (amostra longa)', () => {
    const { x, y } = simulatePair({ beta: 1.4, halfLife: 10, noise: 1.5, days: 20000, seed: 3 });
    const fit = ols(x, y);
    close(fit.b, 1.4, 0.02, 'β');
    const spread = Float64Array.from(y, (v, i) => v - fit.b * x[i] - fit.a);
    close(estimateHalfLife(spread), 10, 1.5, 'meia-vida');
    let sd = 0;
    for (const v of spread) sd += v * v;
    close(Math.sqrt(sd / spread.length), 1.5, 0.15, 'σ estacionário');
  });

  it('z-score móvel: média 0 e desvio 1 dentro da janela', () => {
    const s = [1, 2, 3, 4, 5, 6];
    const z = rollingZ(s, 3);
    assert.ok(Number.isNaN(z[1]));
    close(z[2], 1, 1e-12); // (3 − 2)/1
    close(z[5], 1, 1e-12);
  });

  it('regra entra e sai nos limites e soma o P&L do spread', () => {
    const spread = [0, 0, 2, 3, 1, 0, -2, -1, 0];
    const z = [NaN, 0, 2.5, 3, 1, 0.2, -2.5, -1.2, 0.1];
    const r = zScoreStrategy(spread, z, 2, 0.5);
    assert.deepEqual(Array.from(r.position), [0, 0, -1, -1, -1, 0, 1, 1, 0]);
    // vendido de 2 → 0 (t=2..5): +2; comprado de −2 → 0 (t=6..8): +2.
    close(r.stats.totalPnl, 4, 1e-12);
    assert.equal(r.stats.trades, 2);
    assert.equal(r.stats.hitRate, 1);
  });

  it('pipeline é determinístico por semente', () => {
    const p = { beta: 1.2, halfLife: 8, noise: 1, window: 40, entry: 2, exit: 0.5, seed: 9 };
    assert.deepEqual(runPairsDemo(p).stats, runPairsDemo(p).stats);
  });
});
