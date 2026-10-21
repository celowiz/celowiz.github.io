import { useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { runPairsDemo } from '../../lib/pairs.mjs';
import { AMBER, CORAL, PAPER, TEAL, clipPlot, dot, drawGrid, hline, makeScale, niceTicks, polyline, setupCanvas, type Scale } from '../canvas';
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
} from '../ui';
import { trackEvent } from '../../lib/analytics.mjs';
import pt from './pt.json';
import en from './en.json';

registerDemoText('pairs', pt, en);

const ID = 'pairs';
const DAYS = 500;
type Result = ReturnType<typeof runPairsDemo>;

const CODE = (c: Record<string, string>) => `// pairs.mjs — ${c.head}
const kappa = 1 - 2 ** (-1 / halfLife); // ${c.kappa}
for (let t = 1; t < days; t++) {
  logX += volX * gauss(); // ${c.x}
  s += -kappa * s + shock * gauss(); // Ornstein-Uhlenbeck
  x[t] = Math.exp(logX);
  y[t] = beta * x[t] + alpha + s;
}
// ${c.ols}
const { a, b } = ols(x, y);
const spread = y.map((v, t) => v - b * x[t] - a);
const z = rollingZ(spread, window);
for (let t = 1; t < days; t++) {
  pnl[t] = pnl[t - 1] + pos * (spread[t] - spread[t - 1]);
  if (pos === 0 && z[t] > entry) pos = -1; // ${c.short}
  else if (pos === 0 && z[t] < -entry) pos = 1;
  else if (pos !== 0 && Math.abs(z[t]) < exit) pos = 0;
}`;
const CODES = {
  pt: CODE({ head: 'par sintético + regra de z-score', kappa: 'velocidade de reversão', x: 'X: passeio aleatório', ols: 'hedge ratio por MQO', short: 'vende o spread' }),
  en: CODE({ head: 'synthetic pair + z-score rule', kappa: 'mean-reversion speed', x: 'X: random walk', ols: 'OLS hedge ratio', short: 'short the spread' }),
};

/** Fundo colorido enquanto há posição: teal comprado, coral vendido. */
function shadePositions(c: CanvasRenderingContext2D, s: Scale, r: Result) {
  for (let t = 1; t < r.position.length; t += 1) {
    const pos = r.position[t];
    if (!pos) continue;
    c.fillStyle = pos > 0 ? 'rgba(45,212,191,.07)' : 'rgba(249,115,102,.07)';
    c.fillRect(s.X(t - 1), s.m.t, s.X(t) - s.X(t - 1) + 0.5, s.h - s.m.t - s.m.b);
  }
}

function triangle(c: CanvasRenderingContext2D, x: number, y: number, up: boolean, color: string) {
  c.beginPath();
  c.moveTo(x, y + (up ? -6 : 6));
  c.lineTo(x - 5, y + (up ? 3 : -3));
  c.lineTo(x + 5, y + (up ? 3 : -3));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

const xs = Float64Array.from({ length: DAYS }, (_, i) => i);
const M = { l: 48, r: 12, t: 10, b: 24 };

export default function PairsDemo({ trigger, initialCode }: DemoProps) {
  const { t } = useTranslation();
  const { lang, fmt, pct } = useFormat();
  const [p, setP] = useState({ beta: 1.2, halfLife: 10, noise: 1.5, window: 40, entry: 2, exit: 0.5 });
  const [seed, setSeed] = useState(11);
  const code = useCodeToggle(ID, initialCode);
  useDemoOpen(ID, trigger);

  const exit = Math.min(p.exit, p.entry - 0.1);
  const r = useMemo(() => runPairsDemo({ ...p, exit, days: DAYS, seed }), [p, exit, seed]);

  const drawPrices = useCallback(
    (canvas: HTMLCanvasElement) => {
      const { ctx: c, w, h } = setupCanvas(canvas, 210);
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i < DAYS; i += 1) {
        lo = Math.min(lo, r.x[i], r.y[i]);
        hi = Math.max(hi, r.x[i], r.y[i]);
      }
      const pad = (hi - lo) * 0.06;
      const s = makeScale(w, h, M, [0, DAYS - 1], [lo - pad, hi + pad]);
      drawGrid(c, s, { xTicks: niceTicks(0, DAYS - 1, 5), yTicks: niceTicks(lo, hi, 4), fmtX: (v) => `${fmt(v, 0)}d`, fmtY: (v) => fmt(v, 0) });
      clipPlot(c, s);
      shadePositions(c, s, r);
      polyline(c, s, xs, r.x, { color: AMBER, width: 1.4 });
      polyline(c, s, xs, r.y, { color: TEAL, width: 1.4 });
      c.restore();
    },
    [r, fmt],
  );

  const drawZ = useCallback(
    (canvas: HTMLCanvasElement) => {
      const { ctx: c, w, h } = setupCanvas(canvas, 230);
      let m = p.entry + 0.6;
      for (const v of r.z) if (Number.isFinite(v)) m = Math.max(m, Math.abs(v));
      m = Math.min(m * 1.05, 6);
      const s = makeScale(w, h, M, [0, DAYS - 1], [-m, m]);
      drawGrid(c, s, { xTicks: niceTicks(0, DAYS - 1, 5), yTicks: niceTicks(-m, m, 4), fmtX: (v) => `${fmt(v, 0)}d`, fmtY: (v) => fmt(v, 0) });
      clipPlot(c, s);
      shadePositions(c, s, r);
      hline(c, s, 0, PAPER(0.25), []);
      for (const v of [p.entry, -p.entry]) hline(c, s, v, 'rgba(249,115,102,.7)');
      for (const v of [exit, -exit]) hline(c, s, v, PAPER(0.4), [2, 4]);
      polyline(c, s, xs, r.z, { color: PAPER(0.85), width: 1.3 });
      for (const tr of r.trades) {
        triangle(c, s.X(tr.start), s.Y(r.z[tr.start]), tr.side > 0, tr.side > 0 ? TEAL : CORAL);
        if (!tr.open) dot(c, s.X(tr.end), s.Y(r.z[tr.end]), 3, '#050506', PAPER(0.85));
      }
      c.restore();
    },
    [r, p.entry, exit, fmt],
  );

  const drawPnl = useCallback(
    (canvas: HTMLCanvasElement) => {
      const { ctx: c, w, h } = setupCanvas(canvas, 160);
      let lo = 0;
      let hi = 0;
      for (const v of r.pnl) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
      const pad = (hi - lo) * 0.08 || 1;
      const s = makeScale(w, h, M, [0, DAYS - 1], [lo - pad, hi + pad]);
      drawGrid(c, s, { xTicks: niceTicks(0, DAYS - 1, 5), yTicks: niceTicks(lo - pad, hi + pad, 3), fmtX: (v) => `${fmt(v, 0)}d`, fmtY: (v) => fmt(v, 0) });
      clipPlot(c, s);
      hline(c, s, 0, PAPER(0.3), []);
      polyline(c, s, xs, r.pnl, { color: r.stats.totalPnl >= 0 ? TEAL : CORAL, width: 2 });
      c.restore();
    },
    [r, fmt],
  );

  const pricesRef = useCanvasDraw(drawPrices);
  const zRef = useCanvasDraw(drawZ);
  const pnlRef = useCanvasDraw(drawPnl);
  const set = (key: keyof typeof p) => (v: number) => setP((prev) => ({ ...prev, [key]: v }));
  const hl = Number.isFinite(r.halfLifeEstimate) ? t('lab.pairs.days', { n: fmt(r.halfLifeEstimate, 1) }) : '∞';
  const hit = Number.isNaN(r.stats.hitRate) ? '—' : pct(r.stats.hitRate);

  const controls = (
    <>
      <Slider id="pairs-beta" label={t('lab.pairs.beta')} hint={t('lab.pairs.betaHint')} value={p.beta} display={fmt(p.beta, 2)} min={0.5} max={2} step={0.05} onChange={set('beta')} />
      <Slider
        id="pairs-hl"
        label={t('lab.pairs.halfLife')}
        hint={t('lab.pairs.halfLifeHint')}
        value={p.halfLife}
        display={t('lab.pairs.days', { n: p.halfLife })}
        min={2}
        max={60}
        step={1}
        onChange={set('halfLife')}
      />
      <Slider id="pairs-noise" label={t('lab.pairs.noise')} hint={t('lab.pairs.noiseHint')} value={p.noise} display={fmt(p.noise, 1)} min={0.5} max={5} step={0.1} onChange={set('noise')} />
      <Slider id="pairs-window" label={t('lab.pairs.window')} value={p.window} display={t('lab.pairs.days', { n: p.window })} min={10} max={120} step={5} onChange={set('window')} />
      <Slider id="pairs-entry" label={t('lab.pairs.entry')} value={p.entry} display={fmt(p.entry, 1)} min={1} max={3} step={0.1} onChange={set('entry')} />
      <Slider id="pairs-exit" label={t('lab.pairs.exit')} value={p.exit} display={fmt(exit, 1)} min={0} max={1.5} step={0.1} onChange={set('exit')} />
      <div className="flex flex-wrap gap-2.5">
        <SeedButton onClick={() => setSeed((s) => (s * 7 + 13) % 9973)} />
        <CodeButton id={ID} show={code.show} onToggle={code.toggle} />
      </div>
      <a
        href="https://celowiz.github.io/pairs-trading/"
        onClick={() => trackEvent('project_click', { event_category: 'engagement', event_label: 'pairs-trading', page: 'lab' })}
        className="self-start border-b border-teal/50 pb-0.5 text-[0.88rem] text-teal transition-colors hover:border-teal hover:text-teal-dim"
      >
        {t('lab.pairs.real')}
      </a>
      <p className="text-[0.8rem] leading-relaxed text-paper/55">{t('lab.pairs.note')}</p>
    </>
  );

  return (
    <DemoLayout legend={t('lab.pairs.controls')} controls={controls}>
      <ChartPanel
        title={t('lab.pairs.pricesChart')}
        aside={
          <Legend
            items={[
              { label: 'Y', swatch: 'h-0.5 w-3.5 bg-teal' },
              { label: 'X', swatch: 'h-0.5 w-3.5 bg-[#fbbf24]' },
              { label: t('lab.pairs.long'), swatch: 'h-2 w-3.5 rounded-sm bg-teal/25' },
              { label: t('lab.pairs.short'), swatch: 'h-2 w-3.5 rounded-sm bg-[#f97366]/30' },
            ]}
          />
        }
      >
        <canvas ref={pricesRef} role="img" className="block h-[151px] w-full sm:h-[210px]" aria-label={t('lab.pairs.pricesAria', { n: DAYS })} />
      </ChartPanel>
      <div className="mt-[18px]">
        <ChartPanel title={t('lab.pairs.zChart')} aside={<span className="font-mono text-[0.72rem] text-paper/60">{t('lab.pairs.bands', { entry: fmt(p.entry, 1), exit: fmt(exit, 1) })}</span>}>
          <canvas
            ref={zRef}
            role="img"
            className="block h-[166px] w-full sm:h-[230px]"
            aria-label={t('lab.pairs.zAria', { entry: fmt(p.entry, 1), exit: fmt(exit, 1), trades: r.stats.trades })}
          />
        </ChartPanel>
      </div>
      <div className="mt-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ChartPanel title={t('lab.pairs.pnlChart')}>
          <canvas
            ref={pnlRef}
            role="img"
            className="block h-[115px] w-full sm:h-[160px]"
            aria-label={t('lab.pairs.pnlAria', { pnl: fmt(r.stats.totalPnl, 1), trades: r.stats.trades })}
          />
        </ChartPanel>
        <Observe
          i18nKey="lab.pairs.obs"
          values={{
            beta: fmt(r.fit.b, 3),
            trueBeta: fmt(p.beta, 2),
            hl,
            trueHl: p.halfLife,
            entry: fmt(p.entry, 1),
            exit: fmt(exit, 1),
            trades: r.stats.trades,
            hit,
          }}
          extra={<p className="mt-2 text-paper/70">{t('lab.pairs.obsWarn')}</p>}
        />
      </div>

      <Stats
        items={[
          [t('lab.pairs.betaHat'), fmt(r.fit.b, 3)],
          [t('lab.pairs.hlHat'), hl],
          [t('lab.pairs.trades'), String(r.stats.trades)],
          [t('lab.pairs.hit'), hit],
          [t('lab.pairs.pnl'), `${r.stats.totalPnl >= 0 ? '+' : ''}${fmt(r.stats.totalPnl, 1)}`],
          [t('lab.pairs.holding'), t('lab.pairs.holdingValue', { n: fmt(r.stats.avgHolding, 0) })],
        ]}
      />

      <CodePanel
        id={ID}
        show={code.show}
        code={CODES[lang]}
        formula={
          <>
            <Equation small>Y<sub>t</sub> = β·X<sub>t</sub> + α + s<sub>t</sub></Equation>
            <Equation small>s<sub>t</sub> = (1 − κ)·s<sub>t−1</sub> + σ<sub>ε</sub>·ε<sub>t</sub></Equation>
            <Equation small>z<sub>t</sub> = (s<sub>t</sub> − μ̂<sub>N</sub>) / σ̂<sub>N</sub></Equation>
            <p>
              <Trans i18nKey="lab.pairs.formulaText" components={rich} />
            </p>
          </>
        }
      />
    </DemoLayout>
  );
}
