import { useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { bsGreeks, bsPrice, payoff, type Greeks, type OptionType } from '../../lib/blackScholes.mjs';
import { AMBER, PAPER, TEAL, clipPlot, dot, drawGrid, hline, makeScale, niceTicks, polyline, setupCanvas, vline } from '../canvas';
import type { DemoProps } from '../demos';
import {
  ChartPanel,
  CodeButton,
  CodePanel,
  DemoLayout,
  Equation,
  Legend,
  Observe,
  Segmented,
  Slider,
  Stats,
  registerDemoText,
  rich,
  useCanvasDraw,
  useCodeToggle,
  useDemoOpen,
  useFormat,
} from '../ui';
import pt from './pt.json';
import en from './en.json';

registerDemoText('bs', pt, en);

const ID = 'black-scholes';
type GreekKey = keyof Greeks;
const GREEKS: GreekKey[] = ['delta', 'gamma', 'vega', 'theta', 'rho'];

/** Greeks nas unidades mostradas: vega e rho por 1 p.p., theta por dia corrido. */
function displayGreek(g: Greeks, k: GreekKey) {
  if (k === 'vega' || k === 'rho') return g[k] / 100;
  if (k === 'theta') return g[k] / 365;
  return g[k];
}

const CODE = (c: Record<string, string>) => `// blackScholes.mjs — ${c.head}
export function bsPrice({ S, K, T, sigma, r, q, type }) {
  const v = sigma * Math.sqrt(T);
  const d1 =
    (Math.log(S / K) + (r - q + sigma ** 2 / 2) * T) / v;
  const d2 = d1 - v;
  const dq = Math.exp(-q * T);
  const dr = Math.exp(-r * T);
  return type === 'call'
    ? S * dq * N(d1) - K * dr * N(d2)
    : K * dr * N(-d2) - S * dq * N(-d1);
}

// ${c.cdf}
const N = (x) => 0.5 * (1 + erf(x / Math.SQRT2));

// ${c.greeks}
const gamma = (dq * phi(d1)) / (S * sigma * Math.sqrt(T));
// ${c.vega}
const vega = S * dq * phi(d1) * Math.sqrt(T);`;

const CODES = {
  pt: CODE({ head: 'fórmula fechada, roda direto na página', cdf: 'N(x) via erf: série + fração contínua, erro ~1e−15', greeks: 'gregas analíticas (testadas contra dif. finitas)', vega: 'na tela: ÷100 = por 1 p.p. de vol' }),
  en: CODE({ head: 'closed form, runs right on the page', cdf: 'N(x) via erf: series + continued fraction, ~1e−15', greeks: 'analytic Greeks (tested against finite diffs)', vega: 'on screen: ÷100 = per 1 pp of vol' }),
};

type Params = { S: number; K: number; T: number; sigma: number; r: number; q: number; type: OptionType };

export default function BlackScholesDemo({ trigger, initialCode }: DemoProps) {
  const { t } = useTranslation();
  const { lang, fmt } = useFormat();
  const [p, setP] = useState<Params>({ S: 100, K: 100, T: 0.5, sigma: 30, r: 10, q: 0, type: 'call' });
  const [greek, setGreek] = useState<GreekKey>('delta');
  const code = useCodeToggle(ID, initialCode);
  useDemoOpen(ID, trigger);

  const model = useMemo(() => ({ S: p.S, K: p.K, T: p.T, sigma: p.sigma / 100, r: p.r / 100, q: p.q / 100, type: p.type }), [p]);
  const price = bsPrice(model);
  const g = bsGreeks(model);
  const call = bsPrice({ ...model, type: 'call' });
  const put = bsPrice({ ...model, type: 'put' });
  const intrinsic = payoff(model);
  const typeLabel = t(`lab.bs.${p.type}`);
  const greekLabel = t(`lab.bs.${greek}`);

  const range = useMemo(() => {
    const lo = Math.max(1, p.K * 0.4);
    const hi = p.K * 1.6;
    const xs = Array.from({ length: 161 }, (_, i) => lo + ((hi - lo) * i) / 160);
    return { lo, hi, xs };
  }, [p.K]);

  const drawValue = useCallback(
    (canvas: HTMLCanvasElement) => {
      const { ctx: c, w, h } = setupCanvas(canvas, 300);
      const { lo, hi, xs } = range;
      const value = xs.map((S) => bsPrice({ ...model, S }));
      const pay = xs.map((S) => payoff({ S, K: model.K, type: model.type }));
      const ymax = Math.max(...value, ...pay) * 1.08 || 1;
      const s = makeScale(w, h, { l: 44, r: 12, t: 12, b: 26 }, [lo, hi], [0, ymax]);
      drawGrid(c, s, { xTicks: niceTicks(lo, hi, 5), yTicks: niceTicks(0, ymax, 4), fmtX: (v) => fmt(v, 0), fmtY: (v) => fmt(v, 0) });
      clipPlot(c, s);
      vline(c, s, model.K, PAPER(0.3));
      polyline(c, s, xs, pay, { color: PAPER(0.6), width: 1.5, dash: [5, 4] });
      polyline(c, s, xs, value, { color: TEAL, width: 2.2 });
      if (model.S >= lo && model.S <= hi) {
        vline(c, s, model.S, 'rgba(45,212,191,.35)', [2, 3]);
        dot(c, s.X(model.S), s.Y(price), 4.5, TEAL, '#050506');
      }
      c.restore();
      c.font = '11px ui-monospace, monospace';
      c.fillStyle = PAPER(0.6);
      c.fillText(`K ${fmt(model.K, 0)}`, Math.min(s.X(model.K) + 5, w - 50), s.m.t + 10);
    },
    [range, model, price, fmt],
  );

  const drawGreek = useCallback(
    (canvas: HTMLCanvasElement) => {
      const { ctx: c, w, h } = setupCanvas(canvas, 220);
      const { lo, hi, xs } = range;
      const ys = xs.map((S) => displayGreek(bsGreeks({ ...model, S }), greek));
      let ymin = Math.min(0, ...ys);
      let ymax = Math.max(0, ...ys);
      const pad = (ymax - ymin) * 0.08 || 0.1;
      ymin -= ymin < 0 ? pad : 0;
      ymax += pad;
      const s = makeScale(w, h, { l: 52, r: 12, t: 12, b: 26 }, [lo, hi], [ymin, ymax]);
      const dec = Math.abs(ymax - ymin) < 0.2 ? 3 : Math.abs(ymax - ymin) < 2 ? 2 : 1;
      drawGrid(c, s, { xTicks: niceTicks(lo, hi, 5), yTicks: niceTicks(ymin, ymax, 4), fmtX: (v) => fmt(v, 0), fmtY: (v) => fmt(v, dec) });
      clipPlot(c, s);
      hline(c, s, 0, PAPER(0.25), []);
      vline(c, s, model.K, PAPER(0.3));
      polyline(c, s, xs, ys, { color: AMBER, width: 2 });
      if (model.S >= lo && model.S <= hi) dot(c, s.X(model.S), s.Y(displayGreek(g, greek)), 4.5, AMBER, '#050506');
      c.restore();
    },
    [range, model, greek, g, fmt],
  );

  const valueRef = useCanvasDraw(drawValue);
  const greekRef = useCanvasDraw(drawGreek);
  const set = (key: keyof Params) => (v: number) => setP((prev) => ({ ...prev, [key]: v }));
  const days = Math.round(p.T * 365);
  const fg = (k: GreekKey) => fmt(displayGreek(g, k), k === 'gamma' ? 4 : 3);

  const controls = (
    <>
      <Segmented
        label={t('lab.bs.type')}
        name="bs-type"
        value={p.type}
        options={[
          { value: 'call', label: t('lab.bs.call') },
          { value: 'put', label: t('lab.bs.put') },
        ]}
        onChange={(type) => setP((prev) => ({ ...prev, type }))}
      />
      <Slider id="bs-S" label={t('lab.bs.S')} value={p.S} display={fmt(p.S, 0)} min={40} max={160} step={1} onChange={set('S')} />
      <Slider id="bs-K" label={t('lab.bs.K')} value={p.K} display={fmt(p.K, 0)} min={50} max={150} step={1} onChange={set('K')} />
      <Slider
        id="bs-T"
        label={t('lab.bs.T')}
        hint={t('lab.bs.THint')}
        value={p.T}
        display={t('lab.bs.TValue', { years: fmt(p.T, 2), days })}
        min={0.02}
        max={3}
        step={0.02}
        onChange={set('T')}
      />
      <Slider id="bs-sigma" label={t('lab.bs.sigma')} value={p.sigma} display={`${fmt(p.sigma, 0)}%`} min={5} max={100} step={1} onChange={set('sigma')} />
      <Slider id="bs-r" label={t('lab.bs.r')} hint={t('lab.bs.rHint')} value={p.r} display={`${fmt(p.r, 2)}%`} min={0} max={20} step={0.25} onChange={set('r')} />
      <Slider id="bs-q" label={t('lab.bs.q')} hint={t('lab.bs.qHint')} value={p.q} display={`${fmt(p.q, 2)}%`} min={0} max={10} step={0.25} onChange={set('q')} />
      <Segmented
        label={t('lab.bs.greek')}
        name="bs-greek"
        value={greek}
        options={GREEKS.map((k) => ({ value: k, label: t(`lab.bs.${k}`) }))}
        onChange={setGreek}
      />
      <div className="flex flex-wrap gap-2.5">
        <CodeButton id={ID} show={code.show} onToggle={code.toggle} />
      </div>
      <p className="text-[0.8rem] leading-relaxed text-paper/55">{t('lab.bs.note')}</p>
    </>
  );

  return (
    <DemoLayout legend={t('lab.bs.controls')} controls={controls}>
      <ChartPanel
        title={t('lab.bs.valueChart')}
        aside={
          <Legend
            items={[
              { label: t('lab.bs.valueToday'), swatch: 'h-0.5 w-3.5 bg-teal' },
              { label: t('lab.bs.payoff'), swatch: 'h-0 w-3.5 border-t border-dashed border-paper/60' },
            ]}
          />
        }
      >
        <canvas
          ref={valueRef}
          role="img"
          className="block h-[216px] w-full sm:h-[300px]"
          aria-label={t('lab.bs.valueAria', {
            type: typeLabel,
            from: fmt(range.lo, 0),
            to: fmt(range.hi, 0),
            S: fmt(p.S, 0),
            price: fmt(price),
            payoff: fmt(intrinsic),
          })}
        />
      </ChartPanel>

      <div className="mt-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ChartPanel title={t('lab.bs.greekChart', { greek: greekLabel })} aside={<span className="font-mono text-[0.72rem] text-paper/60">{t(`lab.bs.units.${greek}`)}</span>}>
          <canvas
            ref={greekRef}
            role="img"
            className="block h-[158px] w-full sm:h-[220px]"
            aria-label={t('lab.bs.greekAria', { greek: greekLabel, type: typeLabel, S: fmt(p.S, 0), value: fg(greek) })}
          />
        </ChartPanel>
        <Observe
          i18nKey="lab.bs.obs"
          values={{
            type: typeLabel.split(' ')[0],
            price: fmt(price),
            intrinsic: fmt(intrinsic),
            time: fmt(price - intrinsic),
            delta: fmt(g.delta, 2),
            theta: fmt(g.theta / 365, 3),
          }}
          extra={
            <p className="mt-2 text-paper/70">
              <Trans i18nKey="lab.bs.parity" values={{ value: fmt(call - put), call: fmt(call), put: fmt(put) }} components={rich} />
            </p>
          }
        />
      </div>

      <Stats
        items={[
          [`${t('lab.bs.price')} · ${typeLabel.split(' ')[0]}`, fmt(price)],
          ...GREEKS.map((k) => [t(`lab.bs.${k}`), fg(k)] as [string, string]),
        ]}
      />

      <CodePanel
        id={ID}
        show={code.show}
        code={CODES[lang]}
        formula={
          <>
            <Equation small>
              d₁ = [ln(S/K) + (r − q + σ²/2)T] / (σ√T), &nbsp; d₂ = d₁ − σ√T
            </Equation>
            <Equation small>
              C = S·e<sup>−qT</sup>N(d₁) − K·e<sup>−rT</sup>N(d₂)
            </Equation>
            <Equation small>
              P = K·e<sup>−rT</sup>N(−d₂) − S·e<sup>−qT</sup>N(−d₁)
            </Equation>
            <p>
              <Trans i18nKey="lab.bs.formulaText" components={rich} />
            </p>
          </>
        }
      />
    </DemoLayout>
  );
}
