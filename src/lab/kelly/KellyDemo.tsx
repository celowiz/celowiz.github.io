import { useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { QUANTILES } from '../../lib/gbm.mjs';
import { growthRate, kellyFraction, simulateKelly, zeroGrowthFraction, type KellyParams, type KellyResult } from '../../lib/kelly.mjs';
import { AMBER, CORAL, PAPER, TEAL, clipPlot, dot, drawGrid, hline, makeScale, niceTicks, polyline, setupCanvas, tag, vline } from '../canvas';
import type { DemoProps } from '../demos';
import {
  ChartPanel,
  CodeButton,
  CodePanel,
  DemoLayout,
  Equation,
  Legend,
  Observe,
  SeedButton,
  Slider,
  Stats,
  registerDemoText,
  rich,
  useCanvasDraw,
  useCodeToggle,
  useDemoOpen,
  useFormat,
  useWorkerCompute,
} from '../ui';
import pt from './pt.json';
import en from './en.json';

registerDemoText('kelly', pt, en);

const ID = 'kelly';
const createWorker = () => new Worker(new URL('./kelly.worker.ts', import.meta.url), { type: 'module' });

const CODE = (c: Record<string, string>) => `// kelly.mjs — ${c.head}
export const kellyFraction = (p, b) => p - (1 - p) / b;
export const growthRate = (f, p, b) =>
  p * Math.log1p(f * b) + (1 - p) * Math.log1p(-f);

export function simulateKelly({ p, b, f, bets, n, seed }) {
  const rnd = mulberry32(seed);
  // ${c.wealth}
  const wealth = new Float64Array(n).fill(1);
  for (let t = 1; t <= bets; t++) {
    for (let i = 0; i < n; i++) {
      wealth[i] *= rnd() < p ? 1 + f * b : 1 - f;
    }
    if (isCharted(t)) fan.push(percentiles(wealth));
  }
  return { fan, finals: wealth.sort() };
}`;
const CODES = {
  pt: CODE({ head: 'aposta repetida, roda num Web Worker', wealth: 'todos começam com riqueza 1' }),
  en: CODE({ head: 'repeated bet, runs in a Web Worker', wealth: 'everyone starts with wealth 1' }),
};

type Params = { p: number; b: number; f: number; bets: number; n: number };

function drawGrowth(canvas: HTMLCanvasElement, p: number, b: number, f: number, fmt: (v: number, d?: number) => string, labels: { current: string }) {
  const { ctx: c, w, h } = setupCanvas(canvas, 220);
  const fStar = kellyFraction(p, b);
  const f0 = zeroGrowthFraction(p, b);
  const fmax = Math.min(0.99, Math.max(0.3, f0 * 1.35, f * 1.15));
  const xs = Array.from({ length: 200 }, (_, i) => (fmax * i) / 199);
  const ys = xs.map((x) => growthRate(x, p, b) * 100);
  const gStar = fStar > 0 ? growthRate(fStar, p, b) * 100 : 0;
  const finite = ys.filter(Number.isFinite);
  const ymax = Math.max(gStar, 0.1) * 1.3;
  const ymin = Math.max(Math.min(...finite), -Math.max(ymax * 2.5, 1));
  const s = makeScale(w, h, { l: 48, r: 12, t: 14, b: 26 }, [0, fmax], [ymin, ymax]);
  const base = s.h - s.m.b;
  drawGrid(c, s, {
    xTicks: niceTicks(0, fmax, 5),
    yTicks: niceTicks(ymin, ymax, 4),
    fmtX: (v) => `${fmt(v * 100, 0)}%`,
    fmtY: (v) => `${fmt(v, Math.abs(ymax - ymin) < 2 ? 2 : 1)}%`,
  });
  clipPlot(c, s);
  hline(c, s, 0, PAPER(0.35), []);
  // Área de crescimento negativo (over-betting).
  if (f0 > 0 && f0 < fmax) {
    c.fillStyle = 'rgba(249,115,102,.07)';
    c.fillRect(s.X(f0), s.m.t, s.X(fmax) - s.X(f0), s.h - s.m.t - s.m.b);
  }
  polyline(c, s, xs, ys, { color: TEAL, width: 2 });
  if (fStar > 0) {
    vline(c, s, fStar, 'rgba(45,212,191,.55)');
    vline(c, s, fStar / 2, PAPER(0.35));
    if (f0 < fmax) vline(c, s, f0, 'rgba(249,115,102,.6)');
  }
  const gNow = growthRate(f, p, b) * 100;
  if (Number.isFinite(gNow)) dot(c, s.X(f), s.Y(Math.max(gNow, ymin)), 4.5, AMBER, '#050506');
  c.restore();
  if (fStar > 0) {
    tag(c, s, s.X(fStar), base, 'f*', TEAL);
    tag(c, s, s.X(fStar / 2), base - 14, '½f*', PAPER(0.6), 'left');
    if (f0 < fmax) tag(c, s, s.X(f0), s.m.t + 12, 'g = 0', CORAL);
  }
  if (Number.isFinite(gNow)) {
    // "atual" fica do lado do ponto com mais espaço, longe dos rótulos de f* no rodapé
    const yNow = s.Y(Math.max(gNow, ymin));
    tag(c, s, s.X(f), yNow < (s.m.t + base) / 2 ? yNow + 20 : yNow - 8, labels.current, AMBER);
  }
}

function drawWealth(canvas: HTMLCanvasElement, r: KellyResult, fmt: (v: number, d?: number) => string) {
  const { ctx: c, w, h } = setupCanvas(canvas, 300);
  const K = QUANTILES.length;
  const n = r.times.length;
  const bets = r.times[n - 1];
  let lo = Infinity;
  let hi = -Infinity;
  for (let j = 0; j < n; j += 1) {
    lo = Math.min(lo, r.quantiles[j * K]);
    hi = Math.max(hi, r.quantiles[j * K + K - 1]);
  }
  lo = Math.max(Math.min(lo, 0.5), 1e-4);
  hi = Math.max(hi, 2);
  const s = makeScale(w, h, { l: 50, r: 12, t: 10, b: 26 }, [0, bets], [lo / 1.3, hi * 1.3], true);
  const decades: number[] = [];
  for (let e = Math.floor(Math.log10(lo / 1.3)); e <= Math.ceil(Math.log10(hi * 1.3)); e += 1) decades.push(10 ** e);
  const yTicks = decades.filter((v) => v >= lo / 1.3 && v <= hi * 1.3);
  drawGrid(c, s, {
    xTicks: niceTicks(0, bets, 4),
    yTicks: yTicks.length >= 2 ? yTicks : [lo, 1, hi],
    fmtX: (v) => fmt(v, 0),
    fmtY: (v) => (v >= 1 ? `${fmt(v, 0)}×` : `${fmt(v, v >= 0.01 ? 2 : 4)}×`),
  });
  clipPlot(c, s);
  c.strokeStyle = PAPER(0.08);
  c.lineWidth = 1;
  for (let i = 0; i < r.keptPaths; i += 1) {
    polyline(c, s, r.times, r.paths.subarray(i * n, (i + 1) * n), { color: PAPER(0.08), width: 1 });
  }
  const band = (a: number, b: number, fill: string) => {
    c.beginPath();
    for (let j = 0; j < n; j += 1) {
      const x = s.X(r.times[j]);
      const y = s.Y(r.quantiles[j * K + a]);
      if (j) c.lineTo(x, y);
      else c.moveTo(x, y);
    }
    for (let j = n - 1; j >= 0; j -= 1) c.lineTo(s.X(r.times[j]), s.Y(r.quantiles[j * K + b]));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  };
  band(0, 4, 'rgba(45,212,191,.13)');
  band(1, 3, 'rgba(45,212,191,.26)');
  hline(c, s, 1, PAPER(0.35));
  polyline(c, s, r.times, Array.from({ length: n }, (_, j) => r.quantiles[j * K + 2]), { color: TEAL, width: 2 });
  c.restore();
}

export default function KellyDemo({ trigger, initialCode }: DemoProps) {
  const { t } = useTranslation();
  const { lang, locale, fmt, pct } = useFormat();
  const [p, setP] = useState<Params>({ p: 55, b: 1, f: 10, bets: 300, n: 500 });
  const [seed, setSeed] = useState(7);
  const code = useCodeToggle(ID, initialCode);
  useDemoOpen(ID, trigger);

  const pr = p.p / 100;
  const f = p.f / 100;
  const fStar = kellyFraction(pr, p.b);
  const f0 = zeroGrowthFraction(pr, p.b);
  const g = growthRate(f, pr, p.b);
  const gStar = fStar > 0 ? growthRate(fStar, pr, p.b) : 0;

  const params = useMemo<KellyParams>(() => ({ p: pr, b: p.b, f, bets: p.bets, n: p.n, seed }), [pr, p.b, f, p.bets, p.n, seed]);
  const { result, busy } = useWorkerCompute(createWorker, simulateKelly, params);

  const drawGrowthCb = useCallback((c: HTMLCanvasElement) => drawGrowth(c, pr, p.b, f, fmt, { current: t('lab.kelly.current') }), [pr, p.b, f, fmt, t]);
  const drawWealthCb = useCallback(
    (c: HTMLCanvasElement) => {
      if (result) drawWealth(c, result.r, fmt);
    },
    [result, fmt],
  );
  const growthRef = useCanvasDraw(drawGrowthCb);
  const wealthRef = useCanvasDraw(drawWealthCb);
  const set = (key: keyof Params) => (v: number) => setP((prev) => ({ ...prev, [key]: v }));
  const st = result?.r.stats;
  const gPct = (v: number) => (Number.isFinite(v) ? `${v >= 0 ? '+' : ''}${fmt(v * 100, 2)}%` : '−∞');
  const preset = (mult: number) => setP((prev) => ({ ...prev, f: Math.min(99, Math.max(0, Math.round(fStar * mult * 100))) }));
  const presetBtn = 'rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.82rem] text-paper/80 transition-colors hover:border-white/25 disabled:opacity-40';

  const controls = (
    <>
      <Slider id="kelly-p" label={t('lab.kelly.p')} value={p.p} display={`${fmt(p.p, 0)}%`} min={30} max={80} step={1} onChange={set('p')} />
      <Slider
        id="kelly-b"
        label={t('lab.kelly.b')}
        hint={t('lab.kelly.bHint')}
        value={p.b}
        display={t('lab.kelly.bValue', { b: fmt(p.b, 2) })}
        min={0.5}
        max={3}
        step={0.05}
        onChange={set('b')}
      />
      <Slider id="kelly-f" label={t('lab.kelly.f')} hint={t('lab.kelly.fHint')} value={p.f} display={`${fmt(p.f, 0)}%`} min={0} max={99} step={1} onChange={set('f')} />
      <div role="group" aria-label={t('lab.kelly.presets')} className="flex flex-wrap gap-1.5">
        <button type="button" className={presetBtn} disabled={fStar <= 0} onClick={() => preset(0.5)}>
          {t('lab.kelly.half')}
        </button>
        <button type="button" className={presetBtn} disabled={fStar <= 0} onClick={() => preset(1)}>
          {t('lab.kelly.full')}
        </button>
        <button type="button" className={presetBtn} disabled={fStar <= 0} onClick={() => preset(2)}>
          {t('lab.kelly.double')}
        </button>
      </div>
      <Slider id="kelly-bets" label={t('lab.kelly.bets')} value={p.bets} display={fmt(p.bets, 0)} min={50} max={1000} step={50} onChange={set('bets')} />
      <Slider id="kelly-n" label={t('lab.kelly.n')} value={p.n} display={p.n.toLocaleString(locale)} min={100} max={2000} step={100} onChange={set('n')} />
      <div className="flex flex-wrap gap-2.5">
        <SeedButton onClick={() => setSeed((s) => (s * 7 + 13) % 9973)} />
        <CodeButton id={ID} show={code.show} onToggle={code.toggle} />
      </div>
      <p className="text-[0.8rem] leading-relaxed text-paper/55">{t('lab.kelly.note')}</p>
    </>
  );

  return (
    <DemoLayout legend={t('lab.kelly.controls')} controls={controls}>
      <ChartPanel
        title={t('lab.kelly.wealthChart')}
        aside={
          <Legend
            items={[
              { label: 'P5–P95', swatch: 'h-2 w-3.5 rounded-sm bg-teal/20' },
              { label: 'P25–P75', swatch: 'h-2 w-3.5 rounded-sm bg-teal/40' },
              { label: t('lab.mc.median'), swatch: 'h-0.5 w-3.5 bg-teal' },
            ]}
          />
        }
      >
        <canvas
          ref={wealthRef}
          role="img"
          className="block h-[216px] w-full sm:h-[300px]"
          aria-label={
            st && result
              ? t('lab.kelly.wealthAria', {
                  n: result.p.n.toLocaleString(locale),
                  bets: result.p.bets,
                  f: pct(result.p.f),
                  median: fmt(st.median),
                  p5: fmt(st.p5),
                  p95: fmt(st.p95),
                })
              : t('lab.mc.running')
          }
        />
      </ChartPanel>

      <div className="mt-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ChartPanel title={t('lab.kelly.growthChart')}>
          <canvas
            ref={growthRef}
            role="img"
            className="block h-[158px] w-full sm:h-[220px]"
            aria-label={t('lab.kelly.growthAria', { fStar: pct(Math.max(fStar, 0), 1), f0: pct(f0, 1), f: pct(f), g: gPct(g) })}
          />
        </ChartPanel>
        <Observe
          i18nKey={fStar > 0 ? 'lab.kelly.obs' : 'lab.kelly.obsNoEdge'}
          values={
            fStar > 0
              ? {
                  fStar: pct(fStar, 1),
                  f: pct(f),
                  ratio: fmt(f / fStar, 2),
                  g: gPct(g),
                  gStar: gPct(gStar),
                  f0: pct(f0, 1),
                  halfShare: pct(growthRate(fStar / 2, pr, p.b) / gStar),
                }
              : { p: pct(pr), b: fmt(p.b, 2) }
          }
        />
      </div>

      <Stats
        busy={busy}
        items={[
          [t('lab.kelly.fStar'), fStar > 0 ? pct(fStar, 1) : '0%'],
          [t('lab.kelly.growth'), gPct(g)],
          [t('lab.kelly.median'), st ? `${fmt(st.median, st.median < 10 ? 2 : 0)}×` : '—'],
          [t('lab.kelly.loss'), st ? pct(st.probLoss, 1) : '—'],
          [t('lab.kelly.ruin'), st ? pct(st.probRuin, 1) : '—'],
          [t('lab.kelly.dd'), st ? pct(st.medianMaxDrawdown, 0) : '—'],
        ]}
      />

      <CodePanel
        id={ID}
        show={code.show}
        code={CODES[lang]}
        formula={
          <>
            <Equation>f* = p − (1 − p) / b</Equation>
            <Equation small>g(f) = p·ln(1 + f·b) + (1 − p)·ln(1 − f)</Equation>
            <p>
              <Trans i18nKey="lab.kelly.formulaText" components={rich} />
            </p>
          </>
        }
      />
    </DemoLayout>
  );
}
