// Peças compartilhadas pelos demos do /lab/: sliders, painéis, canvas, "Ver código", estatísticas
// e o hook que roda um cálculo num Web Worker com fila de tamanho 1.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Code, RefreshCw } from 'lucide-react';
import i18n from '../i18n';
import { trackEvent } from '../lib/analytics.mjs';
import { highlight } from './code';
import type { OpenTrigger } from './demos';

/** Textos de um demo, no mesmo chunk do demo (lab.<ns>.*): não pesam no carregamento da página. */
export function registerDemoText(ns: string, pt: object, en: object) {
  i18n.addResourceBundle('pt', 'translation', { lab: { [ns]: pt } }, true, true);
  i18n.addResourceBundle('en', 'translation', { lab: { [ns]: en } }, true, true);
}

export const panel = 'rounded-xl border border-white/10 bg-[#08080a] px-[18px] pt-[18px] pb-2.5';
export const eyebrow = 'font-mono text-[0.7rem] tracking-[0.14em] text-paper/60 uppercase';
export const strong = <strong className="font-semibold text-paper" />;
/** Tags permitidas nos textos traduzidos (<b>, <sup>, <sub>). */
export const rich = { b: strong, sup: <sup />, sub: <sub /> };

/** GA4 + rolagem para o demo quando ele abriu por clique ou link direto (/lab/#id). */
export function useDemoOpen(demo: string, trigger: OpenTrigger) {
  useEffect(() => {
    trackEvent('lab_demo_open', { event_category: 'engagement', event_label: demo, demo, trigger });
    if (trigger === 'scroll') return;
    // Os demos vizinhos também carregam e mudam de altura: mantém este no topo por até 2,5 s,
    // a menos que o visitante role por conta própria.
    const align = () => document.getElementById(demo)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
    let active = true;
    const stop = () => {
      active = false;
    };
    const events = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;
    events.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));
    const ro = new ResizeObserver(() => active && align());
    ro.observe(document.body);
    window.requestAnimationFrame(align);
    const timer = window.setTimeout(() => {
      active = false;
      ro.disconnect();
    }, 2500);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      events.forEach((e) => window.removeEventListener(e, stop));
    };
    // Só no primeiro carregamento do demo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useFormat() {
  const { i18n } = useTranslation();
  const lang: 'pt' | 'en' = i18n.language.startsWith('en') ? 'en' : 'pt';
  const locale = lang === 'en' ? 'en-US' : 'pt-BR';
  const fmt = useCallback(
    (v: number, d = 2) => v.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d }),
    [locale],
  );
  const pct = useCallback((v: number, d = 0) => `${fmt(v * 100, d)}%`, [fmt]);
  return { lang, locale, fmt, pct };
}

/**
 * Cálculo num Web Worker. Enquanto um cálculo roda, só a última mudança de parâmetros fica na
 * fila; resultados desatualizados são descartados. Sem Worker, calcula na thread principal.
 */
export function useWorkerCompute<P, R>(createWorker: () => Worker, compute: (p: P) => R, params: P) {
  const [result, setResult] = useState<{ r: R; p: P } | null>(null);
  const [busy, setBusy] = useState(false);
  const worker = useRef<Worker | null>(null);
  const state = useRef<{ inFlight: boolean; pending: P | null; id: number; sent: P | null }>({
    inFlight: false,
    pending: null,
    id: 0,
    sent: null,
  });
  const factory = useRef(createWorker);
  const fallback = useRef(compute);

  const send = useCallback((p: P) => {
    const s = state.current;
    s.inFlight = true;
    s.id += 1;
    s.sent = p;
    setBusy(true);
    if (worker.current) {
      worker.current.postMessage({ id: s.id, params: p });
    } else {
      window.setTimeout(() => {
        setResult({ r: fallback.current(p), p });
        s.inFlight = false;
        setBusy(false);
      }, 0);
    }
  }, []);

  useEffect(() => {
    try {
      const w = factory.current();
      w.onmessage = (e: MessageEvent<{ id: number; result: R }>) => {
        const s = state.current;
        if (e.data.id !== s.id || !s.sent) return;
        s.inFlight = false;
        if (s.pending) {
          const next = s.pending;
          s.pending = null;
          send(next);
          return;
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

export function Slider({
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

/** Grupo de botões exclusivos (radio) no estilo dos botões do demo. */
export function Segmented<T extends string | number>({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[0.85rem] text-paper/75">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const id = `${name}-${o.value}`;
          const on = o.value === value;
          return (
            <label
              key={String(o.value)}
              htmlFor={id}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[0.82rem] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal ${
                on ? 'border-teal/60 bg-teal/10 text-teal' : 'border-white/10 bg-white/[0.04] text-paper/75 hover:border-white/25'
              }`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                className="sr-only"
                checked={on}
                onChange={() => onChange(o.value)}
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function useCanvasDraw(draw: (canvas: HTMLCanvasElement) => void) {
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

export function SeedButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[0.85rem] text-paper transition-colors hover:border-white/25"
    >
      <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
      {t('lab.mc.newSeed')}
    </button>
  );
}

export function useCodeToggle(demo: string, initial = false) {
  const [show, setShow] = useState(initial);
  const toggle = () =>
    setShow((v) => {
      if (!v) trackEvent('lab_code_view', { event_category: 'engagement', event_label: demo, demo });
      return !v;
    });
  return { show, toggle };
}

export function CodeButton({ id, show, onToggle }: { id: string; show: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={show}
      aria-controls={`${id}-code`}
      className="inline-flex items-center gap-2 rounded-lg border border-teal/45 bg-white/[0.04] px-3.5 py-2 text-[0.85rem] text-teal transition-colors hover:border-teal"
    >
      <Code aria-hidden="true" className="h-3.5 w-3.5" />
      {show ? t('lab.mc.hideCode') : t('lab.mc.showCode')}
    </button>
  );
}

/** Painel "Ver código": fórmula à esquerda, trecho de JS à direita. */
export function CodePanel({ id, show, formula, code }: { id: string; show: boolean; formula: ReactNode; code: string }) {
  const { t } = useTranslation();
  return (
    <div
      id={`${id}-code`}
      hidden={!show}
      className="lab-code mt-[18px] grid grid-cols-1 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0d] md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
    >
      <div className="border-white/10 px-[22px] py-5 text-[0.9rem] leading-[1.7] text-paper/75 max-md:border-b md:border-r">
        <h3 className={eyebrow}>{t('lab.mc.formula')}</h3>
        {formula}
      </div>
      <pre
        className="m-0 overflow-auto px-[22px] py-5 font-mono text-[0.78rem] leading-[1.65] whitespace-pre text-paper/85"
        aria-label={t('lab.mc.codeAria')}
        tabIndex={0}
      >
        <code>{highlight(code)}</code>
      </pre>
    </div>
  );
}

export function Equation({ children, small }: { children: ReactNode; small?: boolean }) {
  return <p className={`my-2.5 font-serif text-paper ${small ? 'text-base' : 'text-[1.15rem]'}`}>{children}</p>;
}

export function Stats({ items, busy }: { items: [ReactNode, string][]; busy?: boolean }) {
  return (
    <dl
      className={`mt-[18px] grid grid-cols-2 gap-x-4 border-t border-white/10 ${
        items.length === 6
          ? 'sm:grid-cols-3 xl:grid-cols-6'
          : items.length === 5
            ? 'sm:grid-cols-5'
            : items.length === 4
              ? 'sm:grid-cols-4'
              : 'sm:grid-cols-3'
      }`}
      aria-busy={busy}
    >
      {items.map(([label, value], i) => (
        <div key={i} className="flex flex-col-reverse pt-3.5">
          <dt className="mt-1 text-[0.7rem] tracking-[0.1em] text-paper/60 uppercase">{label}</dt>
          <dd className="font-serif text-[1.35rem] text-paper sm:text-[1.6rem]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Observe({ i18nKey, values, extra }: { i18nKey: string; values?: Record<string, unknown>; extra?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className={panel}>
      <h3 className={`${eyebrow} mb-2`}>{t('lab.mc.observe')}</h3>
      <div className="pb-2 text-[0.9rem] leading-relaxed text-paper/70" aria-live="polite">
        {values ? (
          <>
            <p>
              <Trans i18nKey={i18nKey} values={values} components={rich} />
            </p>
            {extra}
          </>
        ) : (
          <p>{t('lab.mc.running')}</p>
        )}
      </div>
    </div>
  );
}

export function ChartPanel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={panel}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
        <h3 className={eyebrow}>{title}</h3>
        {aside}
      </div>
      {children}
    </div>
  );
}

export function Legend({ items }: { items: { label: ReactNode; swatch: string }[] }) {
  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.72rem] text-paper/60" aria-hidden="true">
      {items.map((it, i) => (
        <span key={i}>
          <i className={`mr-1.5 inline-block align-middle ${it.swatch}`} />
          {it.label}
        </span>
      ))}
    </span>
  );
}

/** Layout padrão: controles à esquerda (20rem), gráficos à direita. */
export function DemoLayout({ legend, controls, children }: { legend: string; controls: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <fieldset className="flex min-w-0 flex-col gap-5">
        <legend className="sr-only">{legend}</legend>
        {controls}
      </fieldset>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
