import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { simulateGbm, type GbmParams } from '../lib/gbm.mjs';
import { drawFan, drawHistogram } from './charts';
import { CODE } from './code';
import type { DemoProps } from './demos';
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
  strong,
  useCanvasDraw,
  useCodeToggle,
  useDemoOpen,
  useFormat,
  useWorkerCompute,
} from './ui';

type Params = { s0: number; mu: number; sigma: number; days: number; n: number };
const DEFAULTS: Params = { s0: 100, mu: 10, sigma: 30, days: 252, n: 2000 };
const ID = 'monte-carlo';

const createWorker = () => new Worker(new URL('./mc.worker.ts', import.meta.url), { type: 'module' });

export default function MonteCarloDemo({ trigger, initialCode }: DemoProps) {
  const { t } = useTranslation();
  const { lang, locale, fmt, pct } = useFormat();
  const [p, setP] = useState<Params>(DEFAULTS);
  const [seed, setSeed] = useState(42);
  const code = useCodeToggle(ID, initialCode);
  useDemoOpen(ID, trigger);

  const params = useMemo<GbmParams>(
    () => ({ s0: p.s0, mu: p.mu / 100, sigma: p.sigma / 100, days: p.days, n: p.n, seed }),
    [p, seed],
  );
  const { result, busy } = useWorkerCompute(createWorker, simulateGbm, params);
  const shown = result ? { ...result.p, r: result.r } : null;

  const drawFanCb = useCallback(
    (c: HTMLCanvasElement) => {
      if (result) drawFan(c, result.r, result.p.s0, fmt);
    },
    [result, fmt],
  );
  const drawHistCb = useCallback(
    (c: HTMLCanvasElement) => {
      if (result)
        drawHistogram(c, result.r, result.p.s0, fmt, {
          s0: 'S₀',
          median: t('lab.mc.median'),
          tail: (hi) => t('lab.mc.histTail', { hi }),
        });
    },
    [result, fmt, t],
  );
  const fanRef = useCanvasDraw(drawFanCb);
  const histRef = useCanvasDraw(drawHistCb);

  const set = (key: keyof Params) => (v: number) => setP((prev) => ({ ...prev, [key]: v }));
  const years = fmt(p.days / 252, 1);
  const st = shown?.r.stats;

  const controls = (
    <>
      <Slider id="mc-s0" label={t('lab.mc.s0')} value={p.s0} display={fmt(p.s0, 0)} min={10} max={200} step={1} onChange={set('s0')} />
      <Slider
        id="mc-mu"
        label={t('lab.mc.mu')}
        hint={t('lab.mc.muHint')}
        value={p.mu}
        display={`${p.mu >= 0 ? '+' : ''}${fmt(p.mu, 0)}%`}
        min={-30}
        max={40}
        step={1}
        onChange={set('mu')}
      />
      <Slider
        id="mc-sigma"
        label={t('lab.mc.sigma')}
        hint={t('lab.mc.sigmaHint')}
        value={p.sigma}
        display={`${fmt(p.sigma, 0)}%`}
        min={5}
        max={80}
        step={1}
        onChange={set('sigma')}
      />
      <Slider
        id="mc-days"
        label={t('lab.mc.horizon')}
        hint={t('lab.mc.horizonHint')}
        value={p.days}
        display={t('lab.mc.horizonValue', { days: p.days, years })}
        valueText={t('lab.mc.horizonText', { days: p.days, years })}
        min={21}
        max={756}
        step={21}
        onChange={set('days')}
      />
      <Slider id="mc-n" label={t('lab.mc.n')} value={p.n} display={p.n.toLocaleString(locale)} min={100} max={5000} step={100} onChange={set('n')} />
      <div className="flex flex-wrap gap-2.5">
        <SeedButton onClick={() => setSeed((s) => (s * 7 + 13) % 9973)} />
        <CodeButton id={ID} show={code.show} onToggle={code.toggle} />
      </div>
      <p className="text-[0.8rem] leading-relaxed text-paper/55">{t('lab.mc.paramsNote')}</p>
    </>
  );

  return (
    <DemoLayout legend={t('lab.mc.controls')} controls={controls}>
      <ChartPanel
        title={t('lab.mc.fan')}
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
          ref={fanRef}
          role="img"
          className="block h-[245px] w-full sm:h-[340px]"
          aria-label={
            st && shown
              ? t('lab.mc.fanAria', {
                  n: shown.n.toLocaleString(locale),
                  days: shown.days,
                  s0: fmt(shown.s0, 0),
                  median: fmt(st.median),
                  p5: fmt(st.p5),
                  p95: fmt(st.p95),
                })
              : t('lab.mc.running')
          }
        />
      </ChartPanel>

      <div className="mt-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ChartPanel
          title={t('lab.mc.hist')}
          aside={
            <span className="font-mono text-[0.72rem] text-paper/60">
              {shown ? t('lab.mc.histLabel', { n: shown.n.toLocaleString(locale), seed: shown.seed }) : ''}
            </span>
          }
        >
          <canvas
            ref={histRef}
            role="img"
            className="block h-[137px] w-full sm:h-[190px]"
            aria-label={
              st && shown
                ? t('lab.mc.histAria', { below: pct(st.probBelow, 1), s0: fmt(shown.s0, 0), median: fmt(st.median) })
                : t('lab.mc.running')
            }
          />
        </ChartPanel>
        <Observe
          i18nKey={shown && shown.mu >= 0 ? 'lab.mc.obsPositive' : 'lab.mc.obsNegative'}
          values={st && shown ? { sigma: pct(shown.sigma), mean: fmt(st.mean), median: fmt(st.median), below: pct(st.probBelow) } : undefined}
          extra={
            shown && shown.mu > 0 && shown.mu - (shown.sigma * shown.sigma) / 2 < 0 ? (
              <p className="mt-2 text-paper/70">{t('lab.mc.obsDrag')}</p>
            ) : null
          }
        />
      </div>

      <Stats
        busy={busy}
        items={
          [
            [t('lab.mc.statMedian'), st ? fmt(st.median) : '—'],
            [t('lab.mc.statMean'), st ? fmt(st.mean) : '—'],
            ['P5', st ? fmt(st.p5) : '—'],
            ['P95', st ? fmt(st.p95) : '—'],
            [
              <>
                <span aria-hidden="true">
                  P(S<sub>T</sub> &lt; S₀)
                </span>
                <span className="sr-only">{t('lab.mc.statBelowText')}</span>
              </>,
              st ? pct(st.probBelow, 1) : '—',
            ],
          ] as [ReactNode, string][]
        }
      />

      <CodePanel
        id={ID}
        show={code.show}
        code={CODE[lang]}
        formula={
          <>
            <Equation>
              S<sub>t+Δt</sub> = S<sub>t</sub> · exp[(μ − σ²/2)Δt + σ√Δt · Z]
            </Equation>
            <p>
              <Trans i18nKey="lab.mc.formulaText" components={{ b: strong }} />
            </p>
            <Equation small>
              E[S<sub>T</sub>] = S₀·e<sup>μT</sup> &nbsp;·&nbsp; {t('lab.mc.median')} = S₀·e<sup>(μ−σ²/2)T</sup>
            </Equation>
            <p className="text-[0.84rem] text-paper/65">{t('lab.mc.memory')}</p>
          </>
        }
      />
    </DemoLayout>
  );
}
