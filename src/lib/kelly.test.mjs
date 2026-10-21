import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { growthRate, kellyFraction, simulateKelly, zeroGrowthFraction } from './kelly.mjs';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} vs ${b}`);

describe('Kelly do /lab/', () => {
  it('f* clássico: moeda 60/40 com payoff 1:1 → 20%; 55% com 2:1 → 32,5%', () => {
    close(kellyFraction(0.6, 1), 0.2, 1e-12);
    close(kellyFraction(0.55, 2), 0.325, 1e-12);
    assert.ok(kellyFraction(0.4, 1) < 0); // sem vantagem: não apostar
  });

  it('g(f) tem máximo em f* e g(f*) = ln2 + p·ln p + q·ln q para payoff 1:1', () => {
    const p = 0.6;
    const fStar = kellyFraction(p, 1);
    const g = growthRate(fStar, p, 1);
    close(g, Math.log(2) + p * Math.log(p) + (1 - p) * Math.log(1 - p), 1e-12);
    for (const d of [-0.05, -0.01, 0.01, 0.05]) assert.ok(growthRate(fStar + d, p, 1) < g);
  });

  it('meia Kelly mantém ~75% do crescimento; apostar demais zera e depois inverte o crescimento', () => {
    const p = 0.6;
    const fStar = kellyFraction(p, 1);
    const ratio = growthRate(fStar / 2, p, 1) / growthRate(fStar, p, 1);
    close(ratio, 0.75, 0.02, 'meia Kelly');
    const f0 = zeroGrowthFraction(p, 1);
    close(growthRate(f0, p, 1), 0, 1e-9);
    assert.ok(f0 > fStar * 1.8 && f0 < fStar * 2.1, `f0=${f0}`); // ≈ 2f* para vantagem pequena
    assert.ok(growthRate(f0 + 0.05, p, 1) < 0);
  });

  it('Monte Carlo: mediana final ≈ exp(T·g(f)) e over-betting perde quase sempre', () => {
    const base = { p: 0.6, b: 1, bets: 200, n: 4000, seed: 7 };
    const kelly = simulateKelly({ ...base, f: 0.2 });
    close(Math.log(kelly.stats.median) / 200, growthRate(0.2, 0.6, 1), 0.01, 'g empírico');
    const over = simulateKelly({ ...base, f: 0.5 });
    assert.ok(over.stats.median < 1);
    assert.ok(over.stats.probRuin > kelly.stats.probRuin);
    assert.ok(over.stats.medianMaxDrawdown > kelly.stats.medianMaxDrawdown);
    assert.deepEqual(simulateKelly({ ...base, f: 0.2 }).stats, kelly.stats);
  });
});
