import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gbmTheory, histogram, sampleDays, simulateGbm, QUANTILES } from './gbm.mjs';

const base = { s0: 100, mu: 0.1, sigma: 0.3, days: 252, n: 4000, seed: 42 };

describe('Monte Carlo GBM do /lab/', () => {
  it('é determinística por semente e muda com outra semente', () => {
    const a = simulateGbm(base);
    const b = simulateGbm(base);
    const c = simulateGbm({ ...base, seed: 43 });
    assert.deepEqual(a.stats, b.stats);
    assert.notEqual(a.stats.mean, c.stats.mean);
  });

  it('aumentar N mantém as trajetórias desenhadas', () => {
    const small = simulateGbm({ ...base, n: 100 });
    const big = simulateGbm({ ...base, n: 3000 });
    assert.deepEqual(small.paths, big.paths);
  });

  it('média e mediana batem com a teoria (S0·e^{μT} e S0·e^{(μ−σ²/2)T})', () => {
    const { stats } = simulateGbm({ ...base, n: 5000 });
    const theory = gbmTheory(base);
    assert.ok(Math.abs(stats.mean / theory.mean - 1) < 0.03, `${stats.mean} vs ${theory.mean}`);
    assert.ok(Math.abs(stats.median / theory.median - 1) < 0.03, `${stats.median} vs ${theory.median}`);
    assert.ok(stats.mean > stats.median);
    assert.ok(stats.p5 < stats.median && stats.median < stats.p95);
    assert.ok(stats.probBelow > 0.3 && stats.probBelow < 0.55);
  });

  it('percentis ordenados em cada dia e começam em S0', () => {
    const r = simulateGbm(base);
    const k = QUANTILES.length;
    for (let k0 = 0; k0 < k; k0 += 1) assert.equal(r.quantiles[k0], 100);
    for (let j = 0; j < r.times.length; j += 1) {
      for (let q = 1; q < k; q += 1) assert.ok(r.quantiles[j * k + q] >= r.quantiles[j * k + q - 1]);
    }
    assert.equal(r.times[r.times.length - 1], 252);
    assert.equal(r.paths.length, 40 * r.times.length);
    assert.equal(r.finals.length, 4000);
  });

  it('amostra no máximo ~120 dias e sempre inclui o último', () => {
    const t = sampleDays(756);
    assert.ok(t.length <= 130);
    assert.equal(t[0], 0);
    assert.equal(t[t.length - 1], 756);
  });

  it('histograma conta tudo até o P99', () => {
    const r = simulateGbm(base);
    const h = histogram(r.finals, 40);
    const total = h.counts.reduce((a, b) => a + b, 0);
    assert.equal(h.counts.length, 40);
    assert.ok(total >= 0.99 * 4000 && total <= 4000);
  });
});
