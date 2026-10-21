import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { trackEvent } from "../lib/analytics.mjs";
import type {
  B3Summary,
  BcbItem,
  BcbSummary,
  Chip,
  HmmMarket,
  HmmSummary,
  Pair,
  PairsSummary,
  Quad,
  Regime,
  RrgItem,
  RrgSummary,
} from "../types/MercadoHoje";
import { type Fmt, tone } from "./format";

export const REGIME_COLOR: Record<Regime, string> = {
  queda: "#f97366",
  lateral: "#e5b454",
  alta: "#2dd4bf",
};
const QUAD_COLOR: Record<Quad, string> = {
  L: "#2dd4bf",
  W: "#facc15",
  G: "#f87171",
  I: "#60a5fa",
};
const QUADS: Quad[] = ["L", "W", "G", "I"];

const eyebrow =
  "font-mono text-[0.72rem] tracking-[0.14em] text-paper/50 uppercase";
const note = "text-[0.82rem] leading-relaxed text-paper/55";

export function Card({
  id,
  eyebrowText,
  badge,
  warn,
  title,
  more,
  children,
}: {
  id: string;
  eyebrowText: string;
  badge: string;
  warn?: string | null;
  title: string;
  more: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <article
      id={`b-${id}`}
      className="flex min-w-0 flex-col gap-4 border-r border-b border-white/10 px-[18px] pt-6 pb-6 sm:px-[30px] sm:pt-[30px] sm:pb-[26px]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={eyebrow}>{eyebrowText}</span>
        <span className="text-right font-mono text-[0.66rem] tracking-[0.06em] text-teal/85">
          {badge}
          {warn ? <span className="block text-[#e5b454]">{warn}</span> : null}
        </span>
      </div>
      <h3 className="font-serif text-[1.6rem] font-normal tracking-[-0.01em] text-paper sm:text-[1.9rem]">
        {title}
      </h3>
      {children}
      <a
        href={more.href}
        onClick={() =>
          trackEvent("mercado_hoje_click", {
            event_category: "engagement",
            block: id,
            link_url: more.href,
          })
        }
        className="mt-auto self-start border-b border-teal/50 pt-1.5 pb-0.5 text-[0.88rem] text-teal transition-colors hover:border-teal hover:text-teal-dim"
      >
        {more.label}
      </a>
    </article>
  );
}

// ---------- HMM ----------
function RegimeCol({
  m,
  label,
  fmt,
}: {
  m: HmmMarket;
  label: string;
  fmt: Fmt;
}) {
  const { t } = useTranslation();
  const st = m.stats[m.regime];
  const name = t(`mercadoHoje.hmm.names.${m.regime}`);
  return (
    <div>
      <div className="text-[0.8rem] text-paper/60">
        {label}{" "}
        <span className="font-mono text-[0.7rem] text-paper/55">
          · {t("mercadoHoje.hmm.model")}
        </span>
      </div>
      <div
        className="mt-1.5 font-serif text-[2.1rem] leading-tight"
        style={{ color: REGIME_COLOR[m.regime] }}
      >
        {name}
      </div>
      <div className="mt-1 font-mono text-[0.76rem] text-paper/55">
        {m.since
          ? t("mercadoHoje.hmm.since", {
              d: fmt.dm(m.since),
              p: fmt.pct(m.prob, 1, false),
            })
          : fmt.pct(m.prob, 1, false)}
      </div>
      {st?.vol_ann != null ? (
        <div className="mt-1 font-mono text-[0.76rem] text-paper/55">
          {t("mercadoHoje.hmm.vol", { v: fmt.pct(st.vol_ann, 0, false) })}
        </div>
      ) : null}
      {st?.exp_dur != null ? (
        <div className="mt-1 font-mono text-[0.76rem] text-paper/55">
          {t("mercadoHoje.hmm.dur", { n: fmt.num(st.exp_dur, 0) })}
        </div>
      ) : null}
      <div
        className="mt-3 flex h-4 gap-px"
        role="img"
        aria-label={`${label}: ${t("mercadoHoje.hmm.last", { n: m.hist.regimes.length })}`}
      >
        {m.hist.regimes.map((r, i) => (
          <i
            key={i}
            className="flex-1 rounded-[1px]"
            style={{ background: REGIME_COLOR[r] }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[0.66rem] text-paper/55">
        <span>{fmt.dm(m.hist.from)}</span>
        <span>{t("mercadoHoje.hmm.last", { n: m.hist.regimes.length })}</span>
        <span>{fmt.dm(m.hist.to)}</span>
      </div>
    </div>
  );
}

export function HmmBlock({
  h,
  fmt,
  warn,
}: {
  h: HmmSummary;
  fmt: Fmt;
  warn?: string | null;
}) {
  const { t } = useTranslation();
  const { ibov, spx } = h.markets;
  const date = ibov?.date ?? spx?.date ?? h.as_of;
  return (
    <Card
      id="hmm"
      eyebrowText={t("mercadoHoje.hmm.eyebrow")}
      badge={t("mercadoHoje.dates.data", { d: fmt.dm(date) })}
      warn={warn}
      title={t("mercadoHoje.hmm.title")}
      more={{
        href: h.url,
        label: t("mercadoHoje.panel.more", { name: "hmm-regimes" }),
      }}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {ibov ? <RegimeCol m={ibov} label="Ibovespa" fmt={fmt} /> : null}
        {spx ? <RegimeCol m={spx} label="S&P 500" fmt={fmt} /> : null}
      </div>
      <div className="flex flex-wrap gap-3.5 font-mono text-[0.7rem] text-paper/55">
        {(["alta", "lateral", "queda"] as Regime[]).map((r) => (
          <span key={r}>
            <i
              className="mr-1.5 inline-block h-[9px] w-[9px] rounded-[2px] align-[-1px]"
              style={{ background: REGIME_COLOR[r] }}
            />
            {t(`mercadoHoje.hmm.names.${r}`)}
          </span>
        ))}
      </div>
      <p className={note}>
        {ibov?.k2 && ibov.k2.since ? (
          <span
            // texto vem só das traduções; o nome do regime é de uma lista fechada
            dangerouslySetInnerHTML={{
              __html: `${t("mercadoHoje.hmm.k2", { name: t(`mercadoHoje.hmm.names.${ibov.k2.regime}`), d: fmt.dm(ibov.k2.since), interpolation: { escapeValue: true } }).replace("<b>", `<b style="color:${REGIME_COLOR[ibov.k2.regime]};font-weight:500">`)} `,
            }}
          />
        ) : null}
        {t("mercadoHoje.hmm.note")}
      </p>
    </Card>
  );
}

// ---------- RRG ----------
function RrgChart({
  items,
  fmt,
  label,
}: {
  items: RrgItem[];
  fmt: Fmt;
  label: string;
}) {
  const { t } = useTranslation();
  const W = 360,
    H = 300,
    pad = 26;
  const vals = items
    .flatMap((i) => [...i.tx, ...i.ty, i.x, i.y])
    .filter((v): v is number => v != null);
  const ext = Math.max(0.5, ...vals.map((v) => Math.abs(v - 100))) * 1.15;
  const X = (v: number) => pad + ((W - 2 * pad) * ((v - 100) / ext + 1)) / 2;
  const Y = (v: number) =>
    H - pad - ((H - 2 * pad) * ((v - 100) / ext + 1)) / 2;
  const cx = X(100),
    cy = Y(100);
  const rects: [Quad, number, number, number, number][] = [
    ["L", cx, pad, W - pad - cx, cy - pad],
    ["W", cx, cy, W - pad - cx, H - pad - cy],
    ["G", pad, cy, cx - pad, H - pad - cy],
    ["I", pad, pad, cx - pad, cy - pad],
  ];
  const placed: [number, number][] = [];
  const labels = items.map((i) => {
    const lx = X(i.x) + 7;
    let ly = Y(i.y) + 3.5;
    for (let k = 0; k < 6; k += 1) {
      if (
        placed.some(([a, b]) => Math.abs(a - lx) < 30 && Math.abs(b - ly) < 11)
      )
        ly += (k % 2 ? -1 : 1) * 11 * (k + 1);
      else break;
    }
    placed.push([lx, ly]);
    return { t: i.t, lx, ly };
  });
  const mono = "ui-monospace,monospace";
  void fmt;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full"
      role="img"
      aria-label={label}
    >
      {rects.map(([k, x, y, w, h]) => (
        <g key={k}>
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill={QUAD_COLOR[k]}
            fillOpacity={0.045}
          />
          <text
            x={k === "L" || k === "W" ? x + w : x}
            y={k === "L" || k === "I" ? y - 6 : y + h + 13}
            textAnchor={k === "L" || k === "W" ? "end" : "start"}
            fontFamily={mono}
            fontSize={9}
            letterSpacing={1}
            fill={QUAD_COLOR[k]}
            fillOpacity={0.75}
          >
            {t(`mercadoHoje.rrg.q.${k}`).toUpperCase()}
          </text>
        </g>
      ))}
      <line
        x1={cx}
        x2={cx}
        y1={pad}
        y2={H - pad}
        stroke="rgba(255,255,255,.18)"
      />
      <line
        y1={cy}
        y2={cy}
        x1={pad}
        x2={W - pad}
        stroke="rgba(255,255,255,.18)"
      />
      <text
        x={cx}
        y={H - pad + 13}
        textAnchor="middle"
        fontSize={9}
        fontFamily={mono}
        fill="rgba(244,241,234,.4)"
      >
        RS-Ratio →
      </text>
      <text
        transform={`translate(${pad - 8},${cy}) rotate(-90)`}
        textAnchor="middle"
        fontSize={9}
        fontFamily={mono}
        fill="rgba(244,241,234,.4)"
      >
        RS-Momentum →
      </text>
      {items.map((i) => {
        const c = QUAD_COLOR[i.q];
        const pts = i.tx
          .map((x, j) =>
            x != null && i.ty[j] != null ? `${X(x)},${Y(i.ty[j]!)}` : null,
          )
          .filter(Boolean)
          .join(" ");
        return (
          <g key={i.t}>
            <polyline
              points={pts}
              fill="none"
              stroke={c}
              strokeOpacity={0.45}
              strokeWidth={1.2}
            />
            {i.tx
              .slice(0, -1)
              .map((x, j) =>
                x != null && i.ty[j] != null ? (
                  <circle
                    key={j}
                    cx={X(x)}
                    cy={Y(i.ty[j]!)}
                    r={1.6}
                    fill={c}
                    fillOpacity={0.5}
                  />
                ) : null,
              )}
            <circle cx={X(i.x)} cy={Y(i.y)} r={4.2} fill={c} />
          </g>
        );
      })}
      {labels.map((l) => (
        <text
          key={l.t}
          x={l.lx}
          y={l.ly}
          fontSize={10}
          fontFamily={mono}
          fill="#f4f1ea"
        >
          {l.t}
        </text>
      ))}
    </svg>
  );
}

export function RrgBlock({
  r,
  fmt,
  warn,
}: {
  r: RrgSummary;
  fmt: Fmt;
  warn?: string | null;
}) {
  const { t } = useTranslation();
  const st = r.presets.setbr!;
  const short = (i: RrgItem) =>
    t(`mercadoHoje.rrg.sectors.${i.t}`, {
      defaultValue: (fmt.en ? i.name_en : i.name) ?? i.t,
    });
  return (
    <Card
      id="rrg"
      eyebrowText={t("mercadoHoje.rrg.eyebrow")}
      badge={t("mercadoHoje.dates.week", { d: fmt.dm(st.date) })}
      warn={warn}
      title={t("mercadoHoje.rrg.title")}
      more={{
        href: r.url,
        label: t("mercadoHoje.panel.more", { name: "rrg" }),
      }}
    >
      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-[minmax(0,1fr)_12.5rem]">
        <RrgChart
          items={st.items}
          fmt={fmt}
          label={t("mercadoHoje.rrg.chartLabel")}
        />
        <div className="text-[0.82rem] leading-normal">
          {QUADS.map((q) => {
            const its = st.items.filter((i) => i.q === q);
            return (
              <div key={q} className="mb-2.5">
                <div
                  className="font-mono text-[0.68rem] tracking-[0.1em] uppercase"
                  style={{ color: QUAD_COLOR[q] }}
                >
                  {t(`mercadoHoje.rrg.q.${q}`)} · {its.length}
                </div>
                <div className="text-paper/70">
                  {its.map(short).join(", ") || "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className={note}>
        {t("mercadoHoje.rrg.note", { n: st.n, tail: st.tail })}{" "}
        {st.week_complete ? "" : t("mercadoHoje.rrg.forming")}
      </p>
    </Card>
  );
}

// ---------- Monitor B3 ----------
function Bar({
  label,
  a,
  b,
  n,
  ca,
  cb,
}: {
  label: ReactNode;
  a: number;
  b?: number;
  n: number;
  ca: string;
  cb?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[0.8rem] text-paper/65">
        <span>{label}</span>
        <b className="font-mono font-normal text-paper">
          {a} / {n}
        </b>
      </div>
      <div className="mt-1.5 flex h-1 overflow-hidden rounded-sm bg-white/[0.08]">
        <i style={{ width: `${(a / n) * 100}%`, background: ca }} />
        {b != null ? (
          <i
            className="ml-auto"
            style={{ width: `${(b / n) * 100}%`, background: cb }}
          />
        ) : null}
      </div>
    </div>
  );
}
function Chips({
  items,
  render,
}: {
  items: Chip[];
  render: (c: Chip) => ReactNode;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((c) => (
        <span
          key={c.t}
          className="rounded-md border border-white/10 px-[7px] py-[3px] font-mono text-[0.72rem] text-paper/85"
        >
          {c.t}
          <span className="ml-[5px]">{render(c)}</span>
        </span>
      ))}
    </div>
  );
}
function Sig({
  label,
  count,
  items,
  render,
  empty,
}: {
  label: string;
  count: ReactNode;
  items: Chip[];
  render: (c: Chip) => ReactNode;
  empty: string;
}) {
  return (
    <div>
      <div className="flex justify-between border-b border-white/[0.06] pb-1.5 text-[0.8rem] text-paper/65">
        <span>{label}</span>
        <b className="font-mono font-normal text-paper">{count}</b>
      </div>
      {items.length ? (
        <Chips items={items} render={render} />
      ) : (
        <div className="mt-2 font-mono text-[0.72rem] text-paper/55">
          {empty}
        </div>
      )}
    </div>
  );
}

export function B3Block({
  b,
  fmt,
  warn,
}: {
  b: B3Summary;
  fmt: Fmt;
  warn?: string | null;
}) {
  const { t } = useTranslation();
  const n = b.universe.n;
  const chg = (c: Chip) => (
    <span className={tone(c.chg)}>
      {c.chg == null ? "—" : fmt.pct(c.chg, 1)}
    </span>
  );
  const badge =
    t("mercadoHoje.dates.session", {
      d: fmt.dm(b.as_of),
      t: fmt.timeBrt(b.generated_at),
    }) + (b.final ? "" : ` · ${t("mercadoHoje.panel.partial")}`);
  const none = t("mercadoHoje.b3.none");
  return (
    <Card
      id="b3"
      eyebrowText={t("mercadoHoje.b3.eyebrow")}
      badge={badge}
      warn={warn}
      title={t("mercadoHoje.b3.title")}
      more={{
        href: b.url,
        label: t("mercadoHoje.panel.more", { name: "monitor-b3" }),
      }}
    >
      <div className="flex flex-col gap-2.5">
        <Bar
          label={
            <>
              {t("mercadoHoje.b3.adv")}{" "}
              <span className="text-paper/55">
                / {t("mercadoHoje.b3.dec", { n: b.breadth.dec })}
              </span>
            </>
          }
          a={b.breadth.adv}
          b={b.breadth.dec}
          n={n}
          ca="#2dd4bf"
          cb="#f97366"
        />
        <Bar
          label={t("mercadoHoje.b3.a200")}
          a={b.breadth.above200}
          n={n}
          ca="rgba(45,212,191,.7)"
        />
        <Bar
          label={t("mercadoHoje.b3.a50")}
          a={b.breadth.above50}
          n={n}
          ca="rgba(45,212,191,.5)"
        />
      </div>
      <div className="grid grid-cols-1 gap-x-[22px] gap-y-3.5 sm:grid-cols-2">
        <Sig
          label={t("mercadoHoje.b3.high52")}
          count={b.signals.high52.n}
          items={b.signals.high52.items.slice(0, 6)}
          render={chg}
          empty={none}
        />
        <Sig
          label={t("mercadoHoje.b3.golden")}
          count={b.signals.golden.n}
          items={b.signals.golden.items.slice(0, 6)}
          render={chg}
          empty={none}
        />
        <Sig
          label={t("mercadoHoje.b3.volume")}
          count={b.signals.volume.n}
          items={b.signals.volume.items.slice(0, 5)}
          empty={none}
          render={(c) => (
            <span className="text-paper/55">
              {c.vr != null ? `${fmt.num(c.vr, 1)}×` : ""}
            </span>
          )}
        />
        <Sig
          label={t("mercadoHoje.b3.rsiUp")}
          count={b.signals.rsi_up.n}
          items={b.signals.rsi_up.items.slice(0, 6)}
          empty={none}
          render={(c) => (
            <span className="text-paper/55">
              {c.rsi != null ? fmt.num(c.rsi, 0) : ""}
            </span>
          )}
        />
        <Sig
          label={t("mercadoHoje.b3.low52")}
          count={b.signals.low52.n}
          items={b.signals.low52.items.slice(0, 6)}
          render={chg}
          empty={none}
        />
        <Sig
          label={t("mercadoHoje.b3.top")}
          count={t("mercadoHoje.b3.top3")}
          items={b.top.slice(0, 3)}
          render={chg}
          empty={none}
        />
      </div>
      <p className={note}>
        {t("mercadoHoje.b3.universe", {
          n,
          min: fmt.num(b.universe.liq21_min_brl / 1e6, 0),
        })}
      </p>
    </Card>
  );
}

// ---------- Pares ----------
function PairRow({ p, z0, fmt }: { p: Pair; z0: number; fmt: Fmt }) {
  const zx = (z: number) => 50 + (Math.max(-3, Math.min(3, z)) / 3) * 50;
  const far = Math.abs(p.z) >= z0;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_3.2rem] items-center gap-x-3 gap-y-1 border-b border-white/[0.06] py-[7px] text-[0.82rem] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_3.2rem]">
      <span className="col-span-2 text-paper/80 sm:col-span-1 sm:truncate">
        {p.ny} <span className="text-paper/55">×</span> {p.nx}
      </span>
      <span
        className="relative h-3.5 before:absolute before:inset-x-0 before:top-1.5 before:h-0.5 before:bg-white/[0.08]"
        aria-hidden="true"
      >
        <span
          className="absolute top-0.5 h-2.5 border-l border-dashed border-[#f97366]/60"
          style={{ left: `${zx(-z0)}%` }}
        />
        <span
          className="absolute top-0.5 h-2.5 border-l border-dashed border-[#f97366]/60"
          style={{ left: `${zx(z0)}%` }}
        />
        <span
          className="absolute top-0 h-3.5 border-l border-paper/25"
          style={{ left: "50%" }}
        />
        <span
          className="absolute top-[3px] -ml-1 h-2 w-2 rounded-full"
          style={{
            left: `${zx(p.z)}%`,
            background: Math.abs(p.z) >= 1.5 ? "#facc15" : "#2dd4bf",
          }}
        />
      </span>
      <span className={`text-right font-mono ${far ? "text-[#f97366]" : ""}`}>
        {p.z > 0 ? "+" : p.z < 0 ? "−" : ""}
        {fmt.num(Math.abs(p.z), 2)}
      </span>
    </div>
  );
}

export function PairsBlock({
  p,
  fmt,
  warn,
}: {
  p: PairsSummary;
  fmt: Fmt;
  warn?: string | null;
}) {
  const { t } = useTranslation();
  const z0 = p.entry_z ?? 2;
  const out = p.robust.filter((x) => Math.abs(x.z) >= z0).length;
  return (
    <Card
      id="pairs"
      eyebrowText={t("mercadoHoje.pairs.eyebrow")}
      badge={t("mercadoHoje.dates.close", { d: fmt.dm(p.as_of) })}
      warn={warn}
      title={t("mercadoHoje.pairs.title")}
      more={{
        href: p.url,
        label: t("mercadoHoje.panel.more", { name: "pairs-trading" }),
      }}
    >
      <div className="flex flex-wrap items-baseline gap-2.5 font-mono text-[0.8rem] text-paper/55">
        <span>
          <b className="font-serif text-[1.6rem] font-normal text-paper">
            {fmt.num(p.funnel.all_pairs)}
          </b>{" "}
          {t("mercadoHoje.pairs.tested")}
        </span>
        <span>→</span>
        <span>
          <b className="font-serif text-[1.6rem] font-normal text-paper">
            {p.funnel.robust}
          </b>{" "}
          {t("mercadoHoje.pairs.robust")}
        </span>
        <span>+</span>
        <span>
          <b className="font-serif text-[1.6rem] font-normal text-paper">
            {p.funnel.cand}
          </b>{" "}
          {t("mercadoHoje.pairs.cand")}
        </span>
      </div>
      {p.robust.length ? (
        <div>
          <div className={`${eyebrow} mb-1`}>
            {t("mercadoHoje.pairs.robustHead")}{" "}
            <span className="tracking-normal text-paper/55 normal-case">
              {t("mercadoHoje.pairs.bands", { z: z0 })}
            </span>
          </div>
          {p.robust.map((x) => (
            <PairRow key={x.id} p={x} z0={z0} fmt={fmt} />
          ))}
        </div>
      ) : null}
      {p.cand[0] ? (
        <div>
          <div className={`${eyebrow} mb-1`}>
            {t("mercadoHoje.pairs.candHead")}
          </div>
          <PairRow p={p.cand[0]} z0={z0} fmt={fmt} />
        </div>
      ) : null}
      <p className={note}>
        {out
          ? t("mercadoHoje.pairs.outSome", { n: out, z: z0 })
          : t("mercadoHoje.pairs.outNone", { z: z0 })}{" "}
        {t("mercadoHoje.pairs.note")}
      </p>
    </Card>
  );
}

// ---------- Banco Central (SGS) ----------
export function BcbBlock({
  b,
  fmt,
  kept,
  isFresh,
}: {
  b: BcbSummary;
  fmt: Fmt;
  kept: string[];
  isFresh: (k: string, d: string) => boolean;
}) {
  const { t, i18n } = useTranslation();
  const month = (d: string) =>
    new Intl.DateTimeFormat(
      i18n.language.startsWith("en") ? "en-US" : "pt-BR",
      { month: "long", year: "numeric", timeZone: "UTC" },
    ).format(new Date(`${d}T12:00:00Z`));
  const cells: {
    k: "selic" | "cdi" | "ipca12";
    label: string;
    sub: (i: BcbItem) => string | null;
    unit: string;
  }[] = [
    {
      k: "selic",
      label: t("mercadoHoje.bcb.selic"),
      unit: ` ${t("mercadoHoje.bcb.pa")}`,
      sub: (i) =>
        i.since ? t("mercadoHoje.bcb.since", { d: fmt.dm(i.since) }) : null,
    },
    {
      k: "cdi",
      label: t("mercadoHoje.bcb.cdi"),
      unit: ` ${t("mercadoHoje.bcb.pa")}`,
      sub: () => null,
    },
    {
      k: "ipca12",
      label: t("mercadoHoje.bcb.ipca"),
      unit: "",
      sub: (i) => t("mercadoHoje.bcb.month", { m: month(i.date) }),
    },
  ];
  const shown = cells.filter(
    (c) => b.series[c.k] && isFresh(c.k, b.series[c.k]!.date),
  );
  if (!shown.length) return null;
  return (
    <div
      id="b-bcb"
      className="border-r border-b border-white/10 px-[18px] py-6 sm:col-span-2 sm:px-[30px] sm:py-[26px]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={eyebrow}>{t("mercadoHoje.bcb.eyebrow")}</span>
        <a
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent("mercado_hoje_click", {
              event_category: "engagement",
              block: "bcb",
              link_url: b.url,
            })
          }
          className="text-[0.8rem] text-teal transition-colors hover:text-teal-dim"
        >
          {t("mercadoHoje.bcb.more")}
        </a>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {shown.map((c) => {
          const i = b.series[c.k]!;
          const sub = c.sub(i);
          return (
            <div key={c.k} className="border-t border-white/[0.06] pt-3">
              <div className="text-[0.74rem] tracking-[0.12em] text-paper/50 uppercase">
                {c.label}
              </div>
              <div className="mt-2 font-serif text-[1.9rem] leading-none text-paper">
                {fmt.num(i.value, 2)}%
                <span className="ml-1 font-sans text-[0.8rem] text-paper/50">
                  {c.unit}
                </span>
              </div>
              <div className="mt-2 font-mono text-[0.72rem] text-paper/50">
                {sub ? <>{sub} · </> : null}
                {t("mercadoHoje.bcb.src", {
                  code: i.code,
                  d:
                    c.k === "ipca12"
                      ? `${i.date.slice(5, 7)}/${i.date.slice(0, 4)}`
                      : fmt.dm(i.date),
                })}
                {kept.includes(c.k) ? (
                  <span className="text-[#e5b454]">
                    {" "}
                    · {t("mercadoHoje.bcb.kept")}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className={`${note} mt-4`}>{t("mercadoHoje.bcb.note")}</p>
    </div>
  );
}
