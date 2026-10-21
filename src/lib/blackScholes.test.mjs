import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bsGreeks, bsPrice, erf, normCdf } from './blackScholes.mjs';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} vs ${b}`);

describe('Black-Scholes do /lab/', () => {
  it('erf e N(x) batem com valores tabelados', () => {
    close(erf(0.5), 0.5204998778130465, 1e-14);
    close(erf(1), 0.8427007929497149, 1e-14);
    close(erf(3), 0.9999779095030014, 1e-14);
    close(normCdf(1.96), 0.9750021048517795, 1e-13);
    close(normCdf(-1), 0.15865525393145707, 1e-13);
  });

  it('Hull (Options, Futures and Other Derivatives, ex. 15.6): S=42, K=40, r=10%, σ=20%, T=0,5', () => {
    const p = { S: 42, K: 40, T: 0.5, sigma: 0.2, r: 0.1 };
    close(bsPrice({ ...p, type: 'call' }), 4.76, 0.005, 'call');
    close(bsPrice({ ...p, type: 'put' }), 0.81, 0.005, 'put');
  });

  it('ATM de referência (S=K=100, T=1, r=5%, σ=20%): preço e Greeks', () => {
    const p = { S: 100, K: 100, T: 1, sigma: 0.2, r: 0.05 };
    close(bsPrice({ ...p, type: 'call' }), 10.450583572185565, 1e-9, 'call');
    close(bsPrice({ ...p, type: 'put' }), 5.573526022256971, 1e-9, 'put');
    const g = bsGreeks({ ...p, type: 'call' });
    close(g.delta, 0.6368306511756191, 1e-10, 'delta');
    close(g.gamma, 0.018762017345846895, 1e-10, 'gamma');
    close(g.vega, 37.52403469169379, 1e-8, 'vega');
    close(g.theta, -6.414027546438197, 1e-8, 'theta');
    close(g.rho, 53.232481545376345, 1e-8, 'rho');
  });

  it('paridade put-call com dividend yield q', () => {
    for (const p of [
      { S: 90, K: 100, T: 0.25, sigma: 0.35, r: 0.12, q: 0.03 },
      { S: 130, K: 100, T: 2, sigma: 0.15, r: 0.02, q: 0.05 },
    ]) {
      const c = bsPrice({ ...p, type: 'call' });
      const put = bsPrice({ ...p, type: 'put' });
      close(c - put, p.S * Math.exp(-p.q * p.T) - p.K * Math.exp(-p.r * p.T), 1e-10, 'paridade');
    }
  });

  it('Greeks analíticos batem com diferenças finitas', () => {
    for (const type of ['call', 'put']) {
      const p = { S: 95, K: 100, T: 0.75, sigma: 0.3, r: 0.08, q: 0.02, type };
      const g = bsGreeks(p);
      const h = 1e-3;
      const price = (o) => bsPrice({ ...p, ...o });
      close(g.delta, (price({ S: p.S + h }) - price({ S: p.S - h })) / (2 * h), 1e-6, `${type} delta`);
      close(g.gamma, (price({ S: p.S + h }) - 2 * price({}) + price({ S: p.S - h })) / (h * h), 1e-4, `${type} gamma`);
      close(g.vega, (price({ sigma: p.sigma + h }) - price({ sigma: p.sigma - h })) / (2 * h), 1e-4, `${type} vega`);
      close(g.rho, (price({ r: p.r + h }) - price({ r: p.r - h })) / (2 * h), 1e-4, `${type} rho`);
      close(g.theta, -(price({ T: p.T + h }) - price({ T: p.T - h })) / (2 * h), 1e-4, `${type} theta`);
    }
  });

  it('no vencimento vale o payoff', () => {
    assert.equal(bsPrice({ S: 110, K: 100, T: 0, sigma: 0.2, r: 0.05, type: 'call' }), 10);
    assert.equal(bsPrice({ S: 110, K: 100, T: 0, sigma: 0.2, r: 0.05, type: 'put' }), 0);
  });
});
