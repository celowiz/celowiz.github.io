import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logoCrops from "./logo-crop.json";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Home,
  Search,
  TerminalSquare,
  Workflow,
  X,
} from "lucide-react";
import Navbar, { type NavSection } from "../components/Navbar";
import Footer from "../components/Footer";

/**
 * Fonte única: o JSON que o Quant Terminal publica no mesmo domínio (regerado toda noite pelo calendar.yml).
 * Mesma origem (celowiz.github.io) → sem CORS e os logos entram no PNG exportado.
 * A cópia local fica só como reserva se o fetch falhar.
 */
const DATA_URLS = ["/quant-terminal/data/calendar.json", "/data/resultados-3t26.json"];
const LOGO_DIR = "/quant-terminal/logos";
const QT_CAL_URL = "https://celowiz.github.io/quant-terminal/cal/";

type Status = "expected" | "confirmed" | "released";
type Row = {
  ticker: string;
  name: string;
  sector?: string | null;
  weight?: number | null;
  q: string;
  date: string | null;
  status: Status | null;
  source: "RI" | "CVM" | null;
  link: string | null;
  ri_page?: string | null;
  cvm_planned?: { date: string | null; link: string | null } | null;
  filed?: { date: string | null; link: string | null } | null;
  call?: { date: string | null; time: string | null } | null;
  time?: string | null;
};
type Calendar = { as_of: string; quarter: string; rows: Row[] };

// ---------- datas (sempre como dia civil, em UTC para não escorregar de fuso) ----------
const todayBrt = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const toD = (s: string) => new Date(`${s}T12:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => iso(new Date(toD(s).getTime() + n * 864e5));
const mondayOf = (s: string) => {
  const wd = toD(s).getUTCDay(); // 0 dom … 6 sáb
  return addDays(s, wd === 0 ? 1 : wd === 6 ? 2 : 1 - wd); // fim de semana → próxima segunda
};
const addMonths = (ym: string, n: number) => {
  const d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1));
  return iso(d).slice(0, 7);
};

function useCalendar() {
  const [st, setSt] = useState<{ data: Calendar | null; error: boolean }>({ data: null, error: false });
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const url of DATA_URLS) {
        try {
          const r = await fetch(url, { cache: "no-cache" });
          if (!r.ok) throw new Error(String(r.status));
          const data = (await r.json()) as Calendar;
          if (!Array.isArray(data?.rows) || !data.rows.length) throw new Error("empty");
          if (alive) setSt({ data, error: false });
          return;
        } catch {
          /* tenta a próxima */
        }
      }
      if (alive) setSt({ data: null, error: true });
    })();
    return () => {
      alive = false;
    };
  }, []);
  return st;
}

const normSector = (s?: string | null) => (s ? s.replace(/\s+/g, " ").trim() : "");

// ---------- peças ----------
// Enquadramento por logo (gerado por scripts/resultados-logo-crop.py): cor de fundo do PNG,
// zoom e centro da marca. O container usa a cor do fundo, então o zoom não deixa borda.
type Crop = { bg: string; z: number; cx: number; cy: number };
const CROPS = logoCrops as Record<string, Crop>;

function Logo({ ticker, size }: { ticker: string; size: number }) {
  const [broken, setBroken] = useState(false);
  const box = { width: size, height: size };
  const radius = size >= 48 ? "rounded-xl" : "rounded-md";
  if (broken)
    return (
      <span
        style={box}
        className={`flex shrink-0 items-center justify-center ${radius} border border-teal/30 bg-teal/[0.06] font-mono text-[0.7rem] font-semibold tracking-wide text-teal`}
        aria-hidden="true"
      >
        {ticker.slice(0, 4)}
      </span>
    );
  const c = CROPS[ticker] ?? { bg: "#ffffff", z: 1, cx: 0.5, cy: 0.5 };
  const w = size * c.z;
  return (
    <span style={{ ...box, background: c.bg }} className={`relative block shrink-0 overflow-hidden ${radius}`}>
      <img
        src={`${LOGO_DIR}/${ticker}.png`}
        alt=""
        width={w}
        height={w}
        loading="lazy"
        onError={() => setBroken(true)}
        style={{ position: "absolute", width: w, height: w, maxWidth: "none", left: size / 2 - c.cx * w, top: size / 2 - c.cy * w }}
        className="object-cover"
      />
    </span>
  );
}

const STATUS_CLS: Record<Status, string> = {
  expected: "border-white/15 text-paper/65",
  confirmed: "border-teal/40 text-teal",
  released: "border-teal bg-teal/15 text-teal",
};
function StatusPill({ s }: { s: Status | null }) {
  const { t } = useTranslation();
  if (!s) return <span className="font-mono text-[0.72rem] text-paper/55">—</span>;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-[1px] text-[0.68rem] tracking-[0.06em] uppercase ${STATUS_CLS[s]}`}>
      {t(`resultados.status.${s}`)}
    </span>
  );
}

function EventCard({ r, onOpen, sectorLabel }: { r: Row; onOpen: (r: Row) => void; sectorLabel: (s?: string | null) => string }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(r)}
      className="group flex w-full items-center gap-3.5 border-b border-white/[0.06] py-3.5 text-left transition-colors last:border-b-0 hover:bg-white/[0.025] focus-visible:outline-2 focus-visible:outline-teal"
    >
      <Logo ticker={r.ticker} size={56} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="font-mono text-[0.95rem] font-semibold tracking-wide text-paper group-hover:text-teal">{r.ticker}</span>
          <StatusPill s={r.status} />
        </span>
        <span className="mt-0.5 block truncate text-[0.82rem] text-paper/70">{r.name || "—"}</span>
        <span className="block truncate text-[0.74rem] text-paper/55">{sectorLabel(r.sector) || "—"}</span>
      </span>
    </button>
  );
}

function Detail({ r, onClose, fmtLong, sectorLabel }: { r: Row; onClose: () => void; fmtLong: (s: string) => string; sectorLabel: (s?: string | null) => string }) {
  const { t, i18n } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [onClose]);
  const nf = new Intl.NumberFormat(i18n.language.startsWith("en") ? "en-US" : "pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const kv = (k: string, v: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] py-2.5">
      <dt className="text-[0.74rem] tracking-[0.12em] text-paper/55 uppercase">{k}</dt>
      <dd className="text-right text-[0.92rem] text-paper">{v}</dd>
    </div>
  );
  const links: { k: string; href: string | null | undefined }[] = [
    { k: `${t("resultados.detail.source")} · ${r.source === "CVM" ? t("resultados.detail.srcCVM") : r.source === "RI" ? t("resultados.detail.srcRI") : "—"}`, href: r.link },
    { k: t("resultados.detail.ri"), href: r.ri_page && r.ri_page !== r.link ? r.ri_page : null },
    { k: t("resultados.detail.cvmPlan"), href: r.cvm_planned?.link && r.cvm_planned.link !== r.link ? r.cvm_planned.link : null },
    { k: t("resultados.detail.filed"), href: r.filed?.link },
  ];
  const call = r.call?.date ? `${fmtLong(r.call.date)}${r.call.time ? ` · ${r.call.time}` : ""}` : "—";
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="det-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto border border-white/10 bg-[#0b0b0d] p-6 outline-none sm:max-w-lg sm:rounded-2xl sm:p-8"
      >
        <div className="flex items-start gap-5">
          <Logo ticker={r.ticker} size={88} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 id="det-title" className="font-mono text-2xl font-semibold tracking-wide text-paper">{r.ticker}</h2>
              <button type="button" onClick={onClose} className="-mt-1 -mr-2 rounded-full p-2 text-paper/60 hover:text-teal" aria-label={t("resultados.detail.close")}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1 text-paper/75">{r.name || "—"}</p>
            <div className="mt-2"><StatusPill s={r.status} /></div>
          </div>
        </div>
        <dl className="mt-6 border-t border-white/10">
          {kv(t("resultados.detail.date"), r.date ? fmtLong(r.date) : "—")}
          {kv(t("resultados.detail.call"), call)}
          {kv(t("resultados.detail.sector"), sectorLabel(r.sector) || "—")}
          {kv(t("resultados.detail.weight"), r.weight != null ? `${nf.format(r.weight)}%` : "—")}
        </dl>
        <ul className="mt-6 space-y-2">
          {links.filter((l) => l.href).map((l) => (
            <li key={l.k}>
              <a href={l.href!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3 text-[0.9rem] text-paper/85 transition-colors hover:border-teal/50 hover:text-teal">
                <span>{l.k}</span>
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
          {!links.some((l) => l.href) ? <li className="text-paper/55">{t("resultados.detail.source")}: —</li> : null}
        </ul>
        <p className="mt-6 text-[0.78rem] text-paper/55">{t("resultados.hero.disclaimer")}</p>
      </div>
    </div>
  );
}

// ---------- página ----------
export default function ResultadosPage() {
  const { t, i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const loc = en ? "en-US" : "pt-BR";
  const { data, error } = useCalendar();
  const today = todayBrt();
  const [view, setView] = useState<"week" | "month">("week");
  const [mon, setMon] = useState(() => mondayOf(today));
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [sector, setSector] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Row | null>(null);
  const [exporting, setExporting] = useState(false);
  const board = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = en ? "en" : "pt-BR";
    document.title = `${t("resultados.hero.title")} ${data?.quarter ?? ""} · Marcelo Wizenberg`;
  }, [en, t, data]);

  const sectorLabel = useCallback(
    (s?: string | null) => {
      const k = normSector(s);
      return k ? (t(`resultados.sectors.${k}`, { defaultValue: k }) as string) : "";
    },
    [t],
  );
  const dfmt = (o: Intl.DateTimeFormatOptions) => (s: string) => new Intl.DateTimeFormat(loc, { ...o, timeZone: "UTC" }).format(toD(s));
  const dm = dfmt({ day: "2-digit", month: "2-digit" });
  const fmtLong = dfmt({ weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const wdShort = dfmt({ weekday: "short" });
  const monthName = (ym: string) => dfmt({ month: "long", year: "numeric" })(`${ym}-15`);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const sectors = useMemo(
    () => [...new Set(rows.map((r) => normSector(r.sector)).filter(Boolean))].sort((a, b) => sectorLabel(a).localeCompare(sectorLabel(b), loc)),
    [rows, sectorLabel, loc],
  );
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => !sector || normSector(r.sector) === sector)
      .filter((r) => !needle || r.ticker.toLowerCase().includes(needle) || (r.name || "").toLowerCase().includes(needle))
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  }, [rows, sector, q]);
  const byDate = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of filtered) if (r.date) m.set(r.date, [...(m.get(r.date) ?? []), r]);
    return m;
  }, [filtered]);
  const undated = filtered.filter((r) => !r.date);
  const dated = rows.filter((r) => r.date).length;

  const days = [0, 1, 2, 3, 4].map((i) => addDays(mon, i));
  const nav = (n: number) => (view === "week" ? setMon(addDays(mon, 7 * n)) : setMonth(addMonths(month, n)));
  const goToday = () => {
    setMon(mondayOf(today));
    setMonth(today.slice(0, 7));
  };

  // grade do mês: semanas (seg–sex) que tocam o mês
  const monthWeeks = useMemo(() => {
    const first = `${month}-01`;
    const last = addDays(`${addMonths(month, 1)}-01`, -1);
    const out: string[][] = [];
    for (let w = addDays(first, -((toD(first).getUTCDay() + 6) % 7)); w <= last; w = addDays(w, 7)) {
      const wk = [0, 1, 2, 3, 4].map((i) => addDays(w, i));
      if (wk.some((d) => d.slice(0, 7) === month)) out.push(wk);
    }
    return out;
  }, [month]);

  const exportWeek = async () => {
    if (!board.current) return;
    setExporting(true);
    try {
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const { domToBlob } = await import("modern-screenshot");
      const blob = await domToBlob(board.current, { scale: 2, backgroundColor: "#050506" });
      if (!blob) throw new Error("empty");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `resultados-${(data?.quarter ?? "").toLowerCase()}-semana-${mon}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch {
      /* sem imagem: nada a fazer */
    } finally {
      setExporting(false);
    }
  };

  const sections: NavSection[] = [
    { id: "top", label: t("resultados.nav.top"), icon: Home },
    { id: "calendario", label: t("resultados.nav.cal"), icon: CalendarDays },
    { id: "como", label: t("resultados.nav.how"), icon: Workflow },
  ];
  const btn = "inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-[0.85rem] text-paper/80 transition-colors hover:border-teal/50 hover:text-teal disabled:opacity-50";
  const quarter = data?.quarter ?? "3T26";

  return (
    <div className="bg-ink pb-24 sm:pb-0">
      <a href="/" className="fixed top-10 left-4 z-50 flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-full px-2 text-sm text-paper/60 transition-colors hover:text-teal sm:left-6">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        <span className="max-sm:hidden">celowiz</span>
        <span className="sr-only">{t("resultados.back")}</span>
      </a>
      <Navbar sections={sections} />
      <main>
        <header id="top" className="border-b border-white/10 bg-ink pt-26 pb-14 sm:pt-38">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="font-mono text-sm tracking-wide text-teal sm:text-[0.9rem]">
              <span className="select-none text-paper/55">$ </span>
              {t("resultados.hero.prompt")}
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.02] tracking-tight text-paper sm:text-[5.25rem]">
              {t("resultados.hero.title")} <span className="text-teal">{quarter}</span>
            </h1>
            <p className="mt-7 max-w-[44rem] text-[1.05rem] leading-relaxed text-paper/70 sm:text-xl">{t("resultados.hero.lede", { q: quarter })}</p>
            {data ? (
              <div className="mt-6 flex flex-wrap gap-x-[22px] gap-y-2 font-mono text-[0.8rem] text-paper/55">
                <span>
                  <span className="mr-2 inline-block h-[7px] w-[7px] rounded-full bg-teal align-[1px] shadow-[0_0_8px_#2dd4bf]" />
                  {t("resultados.hero.count", { n: rows.length, dated })}
                </span>
                <span>{t("resultados.hero.updated", { d: dm(data.as_of) })}</span>
              </div>
            ) : (
              <p className="mt-8 text-paper/55" role="status">{error ? t("resultados.hero.error") : t("resultados.hero.loading")}</p>
            )}
            <p className="mt-5 text-[0.82rem] text-paper/55">{t("resultados.hero.disclaimer")}</p>
          </div>
        </header>

        <section id="calendario" className="scroll-mt-20 border-b border-white/10 bg-ink py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            {/* controles */}
            <div className="flex flex-wrap items-center gap-3">
              <div role="tablist" aria-label={t("resultados.view.aria")} className="inline-flex rounded-full border border-white/10 p-0.5">
                {(["week", "month"] as const).map((v) => (
                  <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`h-8 rounded-full px-4 text-[0.85rem] transition-colors ${view === v ? "bg-teal/10 text-teal" : "text-paper/70 hover:text-teal"}`}>
                    {t(`resultados.view.${v}`)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className={btn + " w-9 justify-center px-0"} onClick={() => nav(-1)} aria-label={t(view === "week" ? "resultados.ctl.prevWeek" : "resultados.ctl.prevMonth")}>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" className={btn} onClick={goToday}>{t("resultados.ctl.today")}</button>
                <button type="button" className={btn + " w-9 justify-center px-0"} onClick={() => nav(1)} aria-label={t(view === "week" ? "resultados.ctl.nextWeek" : "resultados.ctl.nextMonth")}>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-3 md:justify-end">
                <label className="relative">
                  <span className="sr-only">{t("resultados.ctl.sector")}</span>
                  <select value={sector} onChange={(e) => setSector(e.target.value)} className="h-9 max-w-[15rem] rounded-full border border-white/10 bg-ink px-3.5 text-[0.85rem] text-paper/80 outline-none focus:border-teal/60">
                    <option value="">{t("resultados.ctl.allSectors")}</option>
                    {sectors.map((s) => (
                      <option key={s} value={s}>{sectorLabel(s)}</option>
                    ))}
                  </select>
                </label>
                <label className="relative">
                  <span className="sr-only">{t("resultados.ctl.search")}</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-paper/45" aria-hidden="true" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("resultados.ctl.search")} className="h-9 w-[15rem] rounded-full border border-white/10 bg-transparent pr-3.5 pl-9 text-[0.85rem] text-paper placeholder:text-paper/45 outline-none focus:border-teal/60" />
                </label>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {view === "week" ? (
                <button type="button" className={btn} onClick={exportWeek} disabled={exporting || !data}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {exporting ? t("resultados.ctl.exporting") : t("resultados.ctl.export")}
                </button>
              ) : null}
              <a className={btn} href={QT_CAL_URL} target="_blank" rel="noopener noreferrer">
                <TerminalSquare className="h-4 w-4" aria-hidden="true" />
                {t("resultados.ctl.qt")}
              </a>
            </div>

            {data && view === "week" ? (
              <div ref={board} className={`mt-8 bg-ink ${exporting ? "p-6" : ""}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-white/10 pb-3">
                  <h2 className="font-serif text-3xl tracking-tight text-paper sm:text-4xl">{t("resultados.week.of", { a: dm(days[0]), b: dm(days[4]) })}</h2>
                  <span className="font-mono text-[0.8rem] text-paper/55">
                    {t("resultados.week.n", { count: days.reduce<number>((a, d) => a + (byDate.get(d)?.length ?? 0), 0) })} · {quarter}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5">
                  {days.map((d) => {
                    const evs = byDate.get(d) ?? [];
                    const isToday = d === today;
                    return (
                      <div key={d} className="border-b border-white/10 md:border-r md:border-b-0 md:px-4 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
                        <div className={`flex items-baseline justify-between gap-2 py-3 ${isToday ? "text-teal" : "text-paper/60"}`}>
                          <span className="text-[0.74rem] tracking-[0.12em] uppercase">
                            {wdShort(d).replace(".", "")} <span className="font-mono">{dm(d)}</span>
                          </span>
                          {isToday ? <span className="rounded-full bg-teal/10 px-2 text-[0.68rem] tracking-[0.08em] uppercase">{t("resultados.week.todayTag")}</span> : <span className="font-mono text-[0.72rem] text-paper/45">{evs.length || ""}</span>}
                        </div>
                        <div className={`border-t ${isToday ? "border-teal/60" : "border-white/[0.06]"}`}>
                          {evs.length ? evs.map((r) => <EventCard key={r.ticker} r={r} onOpen={setOpen} sectorLabel={sectorLabel} />) : <p className="py-4 text-[0.82rem] text-paper/40">{t("resultados.week.empty")}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-[0.74rem] text-paper/45">celowiz.github.io/resultados · {t("resultados.hero.disclaimer")}</p>
              </div>
            ) : null}

            {data && view === "month" ? (
              <div className="mt-8">
                <h2 className="border-b border-white/10 pb-3 font-serif text-3xl tracking-tight text-paper first-letter:uppercase sm:text-4xl">{monthName(month)}</h2>
                <div className="hidden grid-cols-5 border-b border-white/10 md:grid">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="py-2 text-[0.72rem] tracking-[0.12em] text-paper/50 uppercase">{wdShort(addDays("2026-10-26", i)).replace(".", "")}</div>
                  ))}
                </div>
                {monthWeeks.map((wk) => (
                  <div key={wk[0]} className="grid grid-cols-1 border-b border-white/10 md:grid-cols-5">
                    {wk.map((d) => {
                      const inMonth = d.slice(0, 7) === month;
                      const evs = inMonth ? byDate.get(d) ?? [] : [];
                      if (!inMonth) return <div key={d} className="hidden min-h-[7.5rem] border-white/[0.06] md:block md:border-r md:last:border-r-0" />;
                      return (
                        <div key={d} className={`border-white/[0.06] py-2.5 md:min-h-[7.5rem] md:border-r md:px-2.5 md:first:pl-0 md:last:border-r-0 ${evs.length ? "" : "max-md:hidden"}`}>
                          <div className={`mb-1.5 font-mono text-[0.78rem] ${d === today ? "text-teal" : "text-paper/55"}`}>
                            <span className="md:hidden">{wdShort(d).replace(".", "")} </span>
                            {dm(d)}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {evs.map((r) => (
                              <button key={r.ticker} type="button" onClick={() => setOpen(r)} title={r.name} className="flex items-center gap-1.5 rounded-lg border border-white/10 py-1 pr-2 pl-1 transition-colors hover:border-teal/50 focus-visible:outline-2 focus-visible:outline-teal">
                                <Logo ticker={r.ticker} size={28} />
                                <span className="font-mono text-[0.74rem] text-paper/85">{r.ticker}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : null}

            {data && !filtered.length ? <p className="mt-8 text-paper/55">{t("resultados.none")}</p> : null}

            {data && undated.length ? (
              <div className="mt-14">
                <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-white/10 pb-3">
                  <h2 className="font-serif text-2xl tracking-tight text-paper sm:text-3xl">{t("resultados.nodate.title")}</h2>
                  <p className="text-[0.88rem] text-paper/55">{t("resultados.nodate.side", { q: quarter })}</p>
                </div>
                <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                  {undated.map((r) => <EventCard key={r.ticker} r={r} onOpen={setOpen} sectorLabel={sectorLabel} />)}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section id="como" className="scroll-mt-20 border-b border-white/10 bg-ink py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
              <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">{t("resultados.how.title")}</h2>
              <p className="max-w-md text-[0.92rem] text-paper/55">{t("resultados.how.side")}</p>
            </div>
            <ol className="mt-9 grid grid-cols-1 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="pt-5 pr-6 pb-4">
                  <div className="font-mono text-[0.72rem] tracking-[0.14em] text-paper/50 uppercase">{t(`resultados.how.s${n}t`)}</div>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-paper/60">{t(`resultados.how.s${n}`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <Footer />
      {open ? <Detail r={open} onClose={() => setOpen(null)} fmtLong={fmtLong} sectorLabel={sectorLabel} /> : null}
    </div>
  );
}
