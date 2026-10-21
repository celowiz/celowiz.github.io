import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Code, RefreshCw } from 'lucide-react';
import { trackEvent } from '../lib/analytics.mjs';
import { simulateGbm, type GbmParams, type GbmResult } from '../lib/gbm.mjs';
import { drawFan, drawHistogram } from './charts';
import { CODE, highlight } from './code';
import type { OpenTrigger } from './LabPage';

type Shown = { r: GbmResult; p: GbmParams };
type Params = { s0: number; mu: number; sigma: number; days: number; n: number };
const DEFAULTS: Params = { s0: 100, mu: 10, sigma: 30, days: 252, n: 2000 };

/** Fila de tamanho 1: enquanto o worker calcula, só a última mudança dos sliders fica guardada. */
function useSimulation(params: GbmParams) {
  const [result, setResult] = useState<Shown | null>(null);
  const [busy, setBusy] = useState(false);
  const worker = useRef<Worker | null>(null);
  const state = useRef<{ inFlight: boolean; pending: GbmParams | null; id: number; sent: GbmParams | null }>({
    inFlight: false,
    pending: null,
    id: 0,
    sent: null,
  });

  const send = useCallback((p: GbmParams) => {
    const s = state.current;
    s.inFlight = true;
    s.id += 1;
    s.sent = p;
    setBusy(true);
    if (worker.current) {
      worker.current.postMessage({ id: s.id, params: p });
    } else {
      // Sem Web Worker (raro): calcula na thread principal, fora do ciclo de render.
      window.setTimeout(() => {
        setResult({ r: simulateGbm(p), p });
        s.inFlight = false;
        setBusy(false);
      }, 0);
    }
  }, []);

  useEffect(() => {
    try {
      const w = new Worker(new URL('./mc.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<{ id: number; result: GbmResult }>) => {
        const s = state.current;
        if (e.data.id !== s.id || !s.sent) return;
        s.inFlight = false;
        if (s.pending) {
          const next = s.pending;
          s.pending = null;
          send(next);
          return; // resultado já desatualizado: espera o próximo
        }
        setResult({ r: e.data.result, p: s.sent });
        setBusy(false);
      };
      worker.current = w;
    } catch {
      worker.current = null;
    }
    return () => {
      worker.current?.terminate();
      worker.current = null;
    };
  }, [send]);

  useEffect(() => {
    if (state.current.inFlight) state.current.pending = params;
    else send(params);
  }, [params, send]);

  return { result, busy };
}

function Slider({
  id,
  label,
  hint,
  value,
  display,
  valueText,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: ReactNode;
  hint?: string;
  value: number;
  display: string;
  valueText?: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[0.85rem] text-paper/75">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="font-mono text-paper">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="lab-range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText ?? display}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-0.5 text-[0.74rem] text-paper/55">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function useCanvasDraw(draw: (canvas: HTMLCanvasElement) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    draw(canvas);
    let lastWidth = canvas.clientWidth;
    const ro = new ResizeObserver(() => {
      if (canvas.clientWidth !== lastWidth) {
        lastWidth = canvas.clientWidth;
        draw(canvas);
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);
  return ref;
}

const panel = 'rounded-xl border border-white/10 bg-[#08080a] px-[18px] pt-[18px] pb-2.5';
const eyebrow = 'font-mono text-[0.7rem] tracking-[0.14em] text-paper/60 uppercase';

export default function MonteCarloDemo({ trigger }: { trigger: OpenTrigger }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('en') ? 'en' : 'pt';
  const locale = lang === 'en' ? 'en-US' : 'pt-BR';
  const [p, setP] = useState<Params>(DEFAULTS);
  const [seed, setSeed] = useState(42);
  const [showCode, setShowCode] = useState(() => window.location.hash === '#code');

  useEffect(() => {
    trackEvent('lab_demo_open', { event_category: 'engagement', event_label: 'monte-carlo', demo: 'monte-carlo', trigger });
    if (trigger === 'hash' && window.location.hash) {
      window.requestAnimationFrame(() => document.getElementById('monte-carlo')?.scrollIntoView());
    }
    // Só no primeiro carregamento do demo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const params = useMemo<GbmParams>(
    () => ({ s0: p.s0, mu: p.mu / 100, sigma: p.sigma / 100, days: p.days, n: p.n, seed }),
    [p, seed],
  );
  const { result, busy } = useSimulation(params);
  // Resultado na tela com os parâmetros que o geraram (podem estar um passo atrás dos sliders).
  const shown = result ? { r: result.r, s0: result.p.s0, sigma: result.p.sigma, mu: result.p.mu, n: result.p.n, seed: result.p.seed, days: result.p.days } : null;

  const fmt = useCallback(
    (v: number, d = 2) => v.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d }),
    [locale],
  );
  const pct = useCallback((v: number, d = 0) => `${fmt(v * 100, d)}%`, [fmt]);

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

  const toggleCode = () => {
    setShowCode((v) => {
      if (!v) trackEvent('lab_code_view', { event_category: 'engagement', event_label: 'monte-carlo', demo: 'monte-carlo' });
      return !v;
    });
  };

  const obsValues = st && shown
    ? { sigma: pct(shown.sigma), mean: fmt(st.mean), median: fmt(st.median), below: pct(st.probBelow) }
    : null;
  const strong = <strong className="font-semibold text-paper" />;

  return (
    <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <fieldset className="flex min-w-0 flex-col gap-5">
        <legend className="sr-only">{t('lab.mc.controls')}</legend>
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
        <Slider
          id="mc-n"
          label={t('lab.mc.n')}
          value={p.n}
          display={p.n.toLocaleString(locale)}
          min={100}
          max={5000}
          step={100}
          onChange={set('n')}
        />
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setSeed((s) => (s * 7 + 13) % 9973)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[0.85rem] text-paper transition-colors hover:border-white/25"
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            {t('lab.mc.newSeed')}
          </button>
          <button
            type="button"
            onClick={toggleCode}
            aria-expanded={showCode}
            aria-controls="mc-code"
            className="inline-flex items-center gap-2 rounded-lg border border-teal/45 bg-white/[0.04] px-3.5 py-2 text-[0.85rem] text-teal transition-colors hover:border-teal"
          >
            <Code aria-hidden="true" className="h-3.5 w-3.5" />
            {showCode ? t('lab.mc.hideCode') : t('lab.mc.showCode')}
          </button>
        </div>
        <p className="text-[0.8rem] leading-relaxed text-paper/55">{t('lab.mc.paramsNote')}</p>
      </fieldset>

      <div className="min-w-0">
        <div className={panel}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
            <h3 className={eyebrow}>{t('lab.mc.fan')}</h3>
            <span className="flex gap-4 font-mono text-[0.72rem] text-paper/60" aria-hidden="true">
              <span><i className="mr-1.5 inline-block h-2 w-3.5 rounded-sm bg-teal/20 align-middle" />P5–P95</span>
              <span><i className="mr-1.5 inline-block h-2 w-3.5 rounded-sm bg-teal/40 align-middle" />P25–P75</span>
              <span><i className="mr-1.5 inline-block h-0.5 w-3.5 bg-teal align-middle" />{t('lab.mc.median')}</span>
            </span>
          </div>
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
        </div>

        <div className="mt-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className={panel}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
              <h3 className={eyebrow}>{t('lab.mc.hist')}</h3>
              <span className="font-mono text-[0.72rem] text-paper/60">
                {shown ? t('lab.mc.histLabel', { n: shown.n.toLocaleString(locale), seed: shown.seed }) : ''}
              </span>
            </div>
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
          </div>
          <div className={panel}>
            <h3 className={`${eyebrow} mb-2`}>{t('lab.mc.observe')}</h3>
            <div className="pb-2 text-[0.9rem] leading-relaxed text-paper/70" aria-live="polite">
              {obsValues && shown ? (
                <>
                  <p>
                    <Trans
                      i18nKey={shown.mu >= 0 ? 'lab.mc.obsPositive' : 'lab.mc.obsNegative'}
                      values={obsValues}
                      components={{ b: strong }}
                    />
                  </p>
                  {shown.mu > 0 && shown.mu - (shown.sigma * shown.sigma) / 2 < 0 ? (
                    <p className="mt-2 text-paper/70">{t('lab.mc.obsDrag')}</p>
                  ) : null}
                </>
              ) : (
                <p>{t('lab.mc.running')}</p>
              )}
            </div>
          </div>
        </div>

        <dl className="mt-[18px] grid grid-cols-2 border-t border-white/10 sm:grid-cols-5" aria-busy={busy}>
          {(
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
          ).map(([label, value], i) => (
            <div key={i} className="flex flex-col-reverse pt-3.5">
              <dt className="mt-1 text-[0.7rem] tracking-[0.1em] text-paper/60 uppercase">{label}</dt>
              <dd className="font-serif text-[1.35rem] text-paper sm:text-[1.6rem]">{value}</dd>
            </div>
          ))}
        </dl>

        <div
          id="mc-code"
          hidden={!showCode}
          className="lab-code mt-[18px] grid-cols-1 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0d] data-[open=true]:grid md:data-[open=true]:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
          data-open={showCode}
        >
          <div className="border-white/10 px-[22px] py-5 text-[0.9rem] leading-[1.7] text-paper/75 max-md:border-b md:border-r">
            <h3 className={eyebrow}>{t('lab.mc.formula')}</h3>
            <p className="my-2.5 font-serif text-[1.15rem] text-paper">
              S<sub>t+Δt</sub> = S<sub>t</sub> · exp[(μ − σ²/2)Δt + σ√Δt · Z]
            </p>
            <p>
              <Trans i18nKey="lab.mc.formulaText" components={{ b: strong }} />
            </p>
            <p className="my-2.5 font-serif text-base text-paper">
              E[S<sub>T</sub>] = S₀·e<sup>μT</sup> &nbsp;·&nbsp; {t('lab.mc.median')} = S₀·e<sup>(μ−σ²/2)T</sup>
            </p>
            <p className="text-[0.84rem] text-paper/65">{t('lab.mc.memory')}</p>
          </div>
          <pre
            className="m-0 overflow-auto px-[22px] py-5 font-mono text-[0.78rem] leading-[1.65] whitespace-pre text-paper/85"
            aria-label={t('lab.mc.codeAria')}
            tabIndex={0}
          >
            <code>{highlight(CODE[lang])}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
