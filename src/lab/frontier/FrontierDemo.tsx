import { useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { efficientFrontier, type FrontierResult } from '../../lib/frontier.mjs';
import { AMBER, PAPER, TEAL, clipPlot, dot, drawGrid, makeScale, niceTicks, polyline, setupCanvas, tag } from '../canvas';
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
  eyebrow,
  panel,
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

registerDemoText('frontier', pt, en);

const ID = 'frontier';
const NAMES = ['A', 'B', 'C', 'D'];
const RANDOM = 2500;
type FrontierParams = Parameters<typeof efficientFrontier>[0];
const createWorker = () => new Worker(new URL('./frontier.worker.ts', import.meta.url), { type: 'module' });

const CODE = (c: Record<string, string>) => `// frontier.mjs — ${c.head}
const cov = vols.map((vi, i) =>
  vols.map((vj, j) => vi * vj * corr[i][j]));
// ${c.bins}
const best = new Array(bins + 1).fill(Infinity);
// ${c.grid}
for (const w of simplexGrid(n, 100)) {
  const { ret, vol } = portfolioStats(w, mu, cov);
  const k = Math.round(((ret - minRet) / span) * bins);
  // ${c.frontier}
  if (vol < best[k]) best[k] = vol;
  if (vol < minVar.vol) minVar = { vol, ret, w: [...w] };
  const sharpe = (ret - rf) / vol;
  if (sharpe > maxSharpe.sharpe)
    maxSharpe = { sharpe, vol, ret, w: [...w] };
}`;
const CODES = {
  pt: CODE({ head: 'só comprado, roda num Web Worker', bins: 'menor vol por faixa de retorno; σ = √(wᵀΣw)', grid: 'todas as carteiras com passo de 1%', frontier: 'fronteira = menor vol para cada retorno' }),
  en: CODE({ head: 'long-only, runs in a Web Worker', bins: 'lowest vol per return bucket; σ = √(wᵀΣw)', grid: 'every portfolio on a 1% grid', frontier: 'frontier = lowest vol for each return' }),
};

type Asset = { ret: number; vol: number };
const DEFAULT_ASSETS: Asset[] = [
  { ret: 6, vol: 8 },
  { ret: 10, vol: 18 },
  { ret: 14, vol: 28 },
  { ret: 12, vol: 22 },
];
// Correlações por par (i < j): AB, AC, AD, BC, BD, CD.
const PAIRS: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];
const DEFAULT_CORR = [0.2, 0.1, 0.3, 0.5, 0.4, 0.6];

function drawChart(canvas: HTMLCanvasElement, r: FrontierResult, assets: Asset[], rf: number, pct: (v: number, d?: number) => string, labels: { minVar: string; maxSharpe: string }) {
  const { ctx: c, w, h } = setupCanvas(canvas, 360);
  let vmax = 0;
  let rmin = rf;
  let rmax = 0;
  for (const a of assets) {
    vmax = Math.max(vmax, a.vol / 100);
    rmax = Math.max(rmax, a.ret / 100);
    rmin = Math.min(rmin, a.ret / 100);
  }
  vmax *= 1.12;
  const span = rmax - rmin || 0.01;
  const s = makeScale(w, h, { l: 46, r: 14, t: 12, b: 26 }, [0, vmax], [rmin - span * 0.08, rmax + span * 0.1]);
  drawGrid(c, s, {
    xTicks: niceTicks(0, vmax, 5),
    yTicks: niceTicks(s.y0, s.y1, 4),
    fmtX: (v) => pct(v, 0),
    fmtY: (v) => pct(v, 0),
  });
  clipPlot(c, s);
  // Nuvem: mais clara quanto maior o Sharpe.
  let smin = Infinity;
  let smax = -Infinity;
  for (let i = 0; i < r.random.length / 3; i += 1) {
    smin = Math.min(smin, r.random[i * 3 + 2]);
    smax = Math.max(smax, r.random[i * 3 + 2]);
  }
  for (let i = 0; i < r.random.length / 3; i += 1) {
    const k = (r.random[i * 3 + 2] - smin) / (smax - smin || 1);
    c.fillStyle = `rgba(45,212,191,${(0.12 + 0.45 * k).toFixed(3)})`;
    c.fillRect(s.X(r.random[i * 3]) - 1, s.Y(r.random[i * 3 + 1]) - 1, 2, 2);
  }
  // Reta de r_f pela carteira de máximo Sharpe.
  const ms = r.maxSharpe;
  polyline(c, s, [0, vmax], [rf, rf + ms.sharpe * vmax], { color: 'rgba(251,191,36,.6)', width: 1.2, dash: [5, 4] });
  const eff = r.curve.filter((p) => p.efficient);
  const ineff = r.curve.filter((p) => !p.efficient);
  polyline(c, s, ineff.map((p) => p.vol), ineff.map((p) => p.ret), { color: PAPER(0.35), width: 1.5, dash: [3, 3] });
  polyline(c, s, eff.map((p) => p.vol), eff.map((p) => p.ret), { color: TEAL, width: 2.4 });
  dot(c, s.X(0), s.Y(rf), 3.5, AMBER);
  c.restore();
  assets.forEach((a, i) => {
    const x = s.X(a.vol / 100);
    const y = s.Y(a.ret / 100);
    dot(c, x, y, 4, PAPER(0.9), '#050506');
    tag(c, s, x, y + 2, NAMES[i], PAPER(0.85));
  });
  dot(c, s.X(r.minVar.vol), s.Y(r.minVar.ret), 5.5, '#050506', PAPER(0.95));
  tag(c, s, s.X(r.minVar.vol), s.Y(r.minVar.ret) + 20, labels.minVar, PAPER(0.85), 'left');
  dot(c, s.X(ms.vol), s.Y(ms.ret), 5.5, AMBER, '#050506');
  tag(c, s, s.X(ms.vol), s.Y(ms.ret) - 4, labels.maxSharpe, AMBER, 'left');
  tag(c, s, s.X(0), s.Y(rf) + 16, 'r_f', AMBER);
}

export default function FrontierDemo({ trigger, initialCode }: DemoProps) {
  const { t } = useTranslation();
  const { lang, fmt, pct } = useFormat();
  const [n, setN] = useState(3);
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [corrs, setCorrs] = useState<number[]>(DEFAULT_CORR);
  const [rf, setRf] = useState(3);
  const code = useCodeToggle(ID, initialCode);
  useDemoOpen(ID, trigger);

  const active = assets.slice(0, n);
  const activePairs = PAIRS.map((pair, k) => ({ pair, k })).filter(({ pair }) => pair[1] < n);

  const params = useMemo<FrontierParams>(() => {
    const corr: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    PAIRS.forEach(([i, j], k) => {
      if (j < n) corr[i][j] = corr[j][i] = corrs[k];
    });
    return {
      mu: assets.slice(0, n).map((a) => a.ret / 100),
      vols: assets.slice(0, n).map((a) => a.vol / 100),
      corr,
      rf: rf / 100,
      randomCount: RANDOM,
      seed: 5,
    };
  }, [n, assets, corrs, rf]);
  const { result, busy } = useWorkerCompute(createWorker, efficientFrontier, params);
  const r = result?.r;
  // Ativos e r_f do resultado na tela (o gráfico não mistura parâmetros novos com resultado antigo).
  const shownAssets = result ? result.p.mu.map((m, i) => ({ ret: m * 100, vol: result.p.vols[i] * 100 })) : active;

  const draw = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (result) drawChart(canvas, result.r, shownAssets, result.p.rf, pct, { minVar: t('lab.frontier.minVar'), maxSharpe: t('lab.frontier.maxSharpe') });
    },
    // shownAssets deriva de result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result, pct, t],
  );
  const chartRef = useCanvasDraw(draw);

  const setAsset = (i: number, key: keyof Asset) => (v: number) =>
    setAssets((prev) => prev.map((a, j) => (j === i ? { ...a, [key]: v } : a)));
  const setCorr = (k: number) => (v: number) => setCorrs((prev) => prev.map((c, j) => (j === k ? v : c)));
  const minAssetVol = Math.min(...shownAssets.map((a) => a.vol / 100));
  const usedCorr = r && result
    ? activePairs
        .filter(({ pair }) => pair[1] < result.p.mu.length)
        .map(({ pair: [i, j] }) => `${NAMES[i]}–${NAMES[j]} ${fmt(r.corr[i][j], 2)}`)
        .join(' · ')
    : '';

  const controls = (
    <>
      <Segmented
        label={t('lab.frontier.assets')}
        name="frontier-n"
        value={n}
        options={[2, 3, 4].map((v) => ({ value: v, label: String(v) }))}
        onChange={setN}
      />
      {active.map((a, i) => (
        <div key={NAMES[i]} className="flex flex-col gap-3 border-t border-white/[0.06] pt-4">
          <p className={eyebrow}>{t('lab.frontier.asset', { name: NAMES[i] })}</p>
          <Slider
            id={`frontier-ret-${i}`}
            label={t('lab.frontier.ret', { name: NAMES[i] })}
            value={a.ret}
            display={`${fmt(a.ret, 1)}%`}
            min={0}
            max={30}
            step={0.5}
            onChange={setAsset(i, 'ret')}
          />
          <Slider id={`frontier-vol-${i}`} label={t('lab.frontier.vol', { name: NAMES[i] })} value={a.vol} display={`${fmt(a.vol, 0)}%`} min={2} max={60} step={1} onChange={setAsset(i, 'vol')} />
        </div>
      ))}
      <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4">
        {activePairs.map(({ pair: [i, j], k }) => (
          <Slider
            key={k}
            id={`frontier-corr-${k}`}
            label={t('lab.frontier.corr', { a: NAMES[i], b: NAMES[j] })}
            value={corrs[k]}
            display={fmt(corrs[k], 2)}
            min={-0.95}
            max={0.95}
            step={0.05}
            onChange={setCorr(k)}
          />
        ))}
      </div>
      {r?.adjusted ? (
        <p role="status" className="rounded-lg border border-[#fbbf24]/40 bg-[#fbbf24]/[0.06] px-3 py-2 text-[0.8rem] leading-relaxed text-paper/80">
          {t('lab.frontier.adjusted', { pct: pct(r.lambda, 0) })}
        </p>
      ) : null}
      <Slider id="frontier-rf" label={t('lab.frontier.rf')} hint={t('lab.frontier.rfHint')} value={rf} display={`${fmt(rf, 2)}%`} min={0} max={15} step={0.25} onChange={setRf} />
      <div className="flex flex-wrap gap-2.5">
        <CodeButton id={ID} show={code.show} onToggle={code.toggle} />
      </div>
      <p className="text-[0.8rem] leading-relaxed text-paper/55">{t('lab.frontier.note')}</p>
    </>
  );

  const th = 'py-2 pr-3 text-left font-normal text-[0.7rem] tracking-[0.1em] text-paper/60 uppercase';
  const td = 'py-1.5 pr-3 font-mono text-[0.82rem] text-paper/85';

  return (
    <DemoLayout legend={t('lab.frontier.controls')} controls={controls}>
      <ChartPanel
        title={t('lab.frontier.chart')}
        aside={
          <Legend
            items={[
              { label: t('lab.frontier.random'), swatch: 'h-2 w-2 rounded-full bg-teal/50' },
              { label: t('lab.frontier.frontier'), swatch: 'h-0.5 w-3.5 bg-teal' },
              { label: t('lab.frontier.cml'), swatch: 'h-0 w-3.5 border-t border-dashed border-[#fbbf24]' },
            ]}
          />
        }
      >
        <canvas
          ref={chartRef}
          role="img"
          className="block h-[259px] w-full sm:h-[360px]"
          aria-label={
            r && result
              ? t('lab.frontier.chartAria', {
                  n: RANDOM,
                  assets: result.p.mu.length,
                  mvRet: pct(r.minVar.ret, 1),
                  mvVol: pct(r.minVar.vol, 1),
                  msRet: pct(r.maxSharpe.ret, 1),
                  msVol: pct(r.maxSharpe.vol, 1),
                  sharpe: fmt(r.maxSharpe.sharpe, 2),
                })
              : t('lab.mc.running')
          }
        />
      </ChartPanel>

      <div className="mt-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className={panel}>
          <h3 className={`${eyebrow} mb-1`}>{t('lab.frontier.weights')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th scope="col" className={th}>{t('lab.frontier.colAsset')}</th>
                  <th scope="col" className={th}>{t('lab.frontier.colRet')}</th>
                  <th scope="col" className={th}>{t('lab.frontier.colVol')}</th>
                  <th scope="col" className={th}>{t('lab.frontier.colMinVar')}</th>
                  <th scope="col" className={`${th} text-[#fbbf24]`}>{t('lab.frontier.colMaxSharpe')}</th>
                </tr>
              </thead>
              <tbody>
                {r && result
                  ? shownAssets.map((a, i) => (
                      <tr key={NAMES[i]} className="border-b border-white/[0.05]">
                        <th scope="row" className={`${td} text-left font-normal`}>{NAMES[i]}</th>
                        <td className={td}>{pct(a.ret / 100, 1)}</td>
                        <td className={td}>{pct(a.vol / 100, 0)}</td>
                        <td className={td}>{pct(r.minVar.w[i], 0)}</td>
                        <td className={td}>{pct(r.maxSharpe.w[i], 0)}</td>
                      </tr>
                    ))
                  : null}
              </tbody>
              {r ? (
                <tfoot>
                  {(
                    [
                      ['rowRet', pct(r.minVar.ret, 1), pct(r.maxSharpe.ret, 1)],
                      ['rowVol', pct(r.minVar.vol, 1), pct(r.maxSharpe.vol, 1)],
                      ['rowSharpe', fmt(r.minVar.sharpe, 2), fmt(r.maxSharpe.sharpe, 2)],
                    ] as const
                  ).map(([k, a, b]) => (
                    <tr key={k}>
                      <th scope="row" colSpan={3} className={`${td} text-left font-sans font-normal text-paper/65`}>
                        {t(`lab.frontier.${k}`)}
                      </th>
                      <td className={td}>{a}</td>
                      <td className={td}>{b}</td>
                    </tr>
                  ))}
                </tfoot>
              ) : null}
            </table>
          </div>
          {r?.adjusted ? <p className="mt-2 pb-1 font-mono text-[0.72rem] text-paper/60">{t('lab.frontier.usedCorr', { list: usedCorr })}</p> : null}
        </div>
        <Observe
          i18nKey={r && minAssetVol - r.minVar.vol > 0.002 ? 'lab.frontier.obs' : 'lab.frontier.obsNoDiv'}
          values={
            r && result
              ? { mvVol: pct(r.minVar.vol, 1), minAssetVol: pct(minAssetVol, 1), sharpe: fmt(r.maxSharpe.sharpe, 2), rf: pct(result.p.rf, 2) }
              : undefined
          }
        />
      </div>

      <Stats
        busy={busy}
        items={[
          [t('lab.frontier.mvVol'), r ? pct(r.minVar.vol, 1) : '—'],
          [t('lab.frontier.mvRet'), r ? pct(r.minVar.ret, 1) : '—'],
          [t('lab.frontier.msSharpe'), r ? fmt(r.maxSharpe.sharpe, 2) : '—'],
          [t('lab.frontier.msRet'), r ? pct(r.maxSharpe.ret, 1) : '—'],
          [t('lab.frontier.msVol'), r ? pct(r.maxSharpe.vol, 1) : '—'],
        ]}
      />

      <CodePanel
        id={ID}
        show={code.show}
        code={CODES[lang]}
        formula={
          <>
            <Equation small>
              μ<sub>p</sub> = wᵀμ, &nbsp; σ<sub>p</sub> = √(wᵀΣw)
            </Equation>
            <Equation small>
              Sharpe = (μ<sub>p</sub> − r<sub>f</sub>) / σ<sub>p</sub>
            </Equation>
            <p>
              <Trans i18nKey="lab.frontier.formulaText" components={rich} />
            </p>
          </>
        }
      />
    </DemoLayout>
  );
}
