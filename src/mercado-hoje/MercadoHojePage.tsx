import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Home, LayoutGrid, Workflow } from "lucide-react";
import Navbar, { type NavSection } from "../components/Navbar";
import Footer from "../components/Footer";
import type { MercadoHojeData } from "../types/MercadoHoje";
import { B3Block, BcbBlock, HmmBlock, PairsBlock, RrgBlock } from "./Blocks";
import {
  daysBetween,
  freshBlocks,
  makeFmt,
  todayBrt,
  tone,
  type Fmt,
} from "./format";

const ITEM_STALE: Record<string, number> = {
  selic: 7,
  cdi: 7,
  ptax: 7,
  ipca12: 75,
};

function useData() {
  const [state, setState] = useState<{
    data: MercadoHojeData | null;
    error: boolean;
  }>({ data: null, error: false });
  useEffect(() => {
    let alive = true;
    fetch("/mercado-hoje.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<MercadoHojeData>;
      })
      .then((data) => alive && setState({ data, error: false }))
      .catch(() => alive && setState({ data: null, error: true }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/** Destaques **…** do texto por regras viram <em> teal (texto só da build, sem HTML). */
function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <em key={i} className="text-teal not-italic">
            {p}
          </em>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function Cell({
  label,
  value,
  detail,
  date,
}: {
  label: string;
  value: string;
  detail: ReactNode;
  date: string;
}) {
  return (
    <div className="border-white/[0.06] py-3.5 max-sm:border-b sm:mr-6 sm:border-r sm:py-0 sm:pt-[18px] sm:pr-6 sm:last:mr-0 sm:last:border-r-0">
      <div className="text-[0.74rem] tracking-[0.12em] text-paper/50 uppercase">
        {label}
      </div>
      <div className="mt-2 font-serif text-[1.6rem] leading-none text-paper sm:text-[2rem]">
        {value}
      </div>
      <div className="mt-2 font-mono text-[0.78rem]">
        {detail} <span className="text-paper/55">· {date}</span>
      </div>
    </div>
  );
}

function Strip({
  data,
  fmt,
}: {
  data: ReturnType<typeof freshBlocks> & {
    ptaxOk: boolean;
    bcb: MercadoHojeData["blocks"]["bcb"];
  };
  fmt: Fmt;
}) {
  const { t } = useTranslation();
  const { b3, rrg } = data;
  const cells: ReactNode[] = [];
  if (b3) {
    const d = fmt.dm(b3.as_of);
    cells.push(
      <Cell
        key="ibov"
        label={t("mercadoHoje.strip.ibov")}
        value={fmt.num(b3.bench.price, 0)}
        detail={
          <span className={tone(b3.bench.chg)}>{fmt.pct(b3.bench.chg, 2)}</span>
        }
        date={d}
      />,
    );
    if (b3.bench.ret21 != null)
      cells.push(
        <Cell
          key="ibov21"
          label={t("mercadoHoje.strip.ibov21")}
          value={fmt.pct(b3.bench.ret21, 1)}
          detail={
            <span className="text-paper/55">
              {t("mercadoHoje.strip.ret21")}
            </span>
          }
          date={d}
        />,
      );
    if (b3.bench.ifix_chg != null)
      cells.push(
        <Cell
          key="ifix"
          label={t("mercadoHoje.strip.ifix", {
            proxy: b3.bench.ifix_proxy ?? "XFIX11",
          })}
          value={fmt.pct(b3.bench.ifix_chg, 2)}
          detail={
            <span className="text-paper/55">
              {b3.bench.ifix_ret21 != null
                ? t("mercadoHoje.strip.d21", {
                    v: fmt.pct(b3.bench.ifix_ret21, 1),
                  })
                : ""}
            </span>
          }
          date={d}
        />,
      );
  }
  // S&P 500: fechamento do Monitor B3 (mesmo dia) se houver; senão o do RRG.
  const us =
    b3?.us?.bench?.price != null && b3.us.bench.chg != null
      ? { v: b3.us.bench.price, c: b3.us.bench.chg, d: b3.us.as_of }
      : null;
  const spx =
    us ??
    (rrg?.quotes.spx
      ? {
          v: rrg.quotes.spx.value,
          c: rrg.quotes.spx.chg,
          d: rrg.quotes.spx.date,
        }
      : null);
  if (spx)
    cells.push(
      <Cell
        key="spx"
        label={t("mercadoHoje.strip.spx")}
        value={fmt.num(spx.v, 0)}
        detail={<span className={tone(spx.c)}>{fmt.pct(spx.c, 2)}</span>}
        date={fmt.dm(spx.d)}
      />,
    );
  // Dólar: uma fonte só. PTAX oficial (BCB) quando houver; o USD/BRL do Yahoo (RRG) é só reserva.
  const ptax = data.ptaxOk ? data.bcb?.series.ptax : undefined;
  if (ptax)
    cells.push(
      <Cell
        key="usd"
        label={t("mercadoHoje.strip.ptax")}
        value={`R$ ${fmt.num(ptax.value, 4)}`}
        detail={
          <span className={tone(ptax.chg)}>
            {ptax.chg != null ? fmt.pct(ptax.chg, 2) : ""}
          </span>
        }
        date={fmt.dm(ptax.date)}
      />,
    );
  else if (rrg?.quotes.usdbrl)
    cells.push(
      <Cell
        key="usd"
        label={t("mercadoHoje.strip.usd")}
        value={`R$ ${fmt.num(rrg.quotes.usdbrl.value, 3)}`}
        detail={
          <span className={tone(rrg.quotes.usdbrl.chg)}>
            {fmt.pct(rrg.quotes.usdbrl.chg, 2)}
          </span>
        }
        date={fmt.dm(rrg.quotes.usdbrl.date)}
      />,
    );
  if (!cells.length) return null;
  return (
    <div className="mt-10 grid grid-cols-2 border-t border-white/10 sm:grid-cols-3 lg:grid-cols-5">
      {cells}
    </div>
  );
}

export default function MercadoHojePage() {
  const { t, i18n } = useTranslation();
  const { data, error } = useData();
  const fmt = useMemo(() => makeFmt(i18n.language), [i18n.language]);
  const en = i18n.language.startsWith("en");

  useEffect(() => {
    document.title = t("mercadoHoje.metaTitle");
  }, [t, i18n.language]);

  const today = todayBrt();
  const fresh = useMemo(() => {
    if (!data) return null;
    const f = freshBlocks(data, today);
    const bcb = data.blocks.bcb ?? null;
    const ptax = bcb?.series.ptax;
    return {
      ...f,
      bcb,
      ptaxOk: Boolean(ptax && daysBetween(ptax.date, today) <= ITEM_STALE.ptax),
    };
  }, [data, today]);
  const warn = (k: "b3" | "rrg" | "hmm" | "pairs") =>
    data?.sources?.[k]?.status === "fallback"
      ? t("mercadoHoje.panel.fallback")
      : null;
  const ref = fresh?.b3?.as_of ?? data?.as_of ?? null;
  const panels = fresh
    ? [
        fresh.hmm,
        fresh.rrg?.presets.setbr ? fresh.rrg : null,
        fresh.b3,
        fresh.pairs,
      ].filter(Boolean).length
    : 0;

  const sections: NavSection[] = [
    { id: "top", label: t("mercadoHoje.nav.top"), icon: Home },
    { id: "painel", label: t("mercadoHoje.nav.panel"), icon: LayoutGrid },
    { id: "como", label: t("mercadoHoje.nav.how"), icon: Workflow },
  ];

  return (
    <div className="bg-ink pb-24 sm:pb-0">
      <a
        href="/"
        className="fixed top-10 left-4 z-50 flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-full px-2 text-sm text-paper/60 transition-colors hover:text-teal sm:left-6"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        <span className="max-sm:hidden">celowiz</span>
        <span className="sr-only">{t("mercadoHoje.back")}</span>
      </a>
      <Navbar sections={sections} />
      <main>
        <header
          id="top"
          className="border-b border-white/10 bg-ink pt-26 pb-16 sm:pt-38"
        >
          <div className="hero-copy mx-auto max-w-7xl px-5 sm:px-8">
            <p className="font-mono text-sm tracking-wide text-teal sm:text-[0.9rem]">
              <span className="select-none text-paper/55">$ </span>
              {t("mercadoHoje.hero.prompt")}
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.02] tracking-tight text-paper sm:text-[5.25rem]">
              {t("mercadoHoje.hero.title")}
            </h1>
            <p className="mt-7 max-w-[44rem] text-[1.05rem] leading-relaxed text-paper/70 sm:text-xl">
              {t("mercadoHoje.hero.lede")}
            </p>
            <div
              data-mh-live
              className={data ? undefined : "min-h-[48rem] sm:min-h-[26rem]"}
            >
              {data && ref ? (
                <div className="mt-6 flex flex-wrap gap-x-[22px] gap-y-2 font-mono text-[0.8rem] text-paper/55">
                  <span>
                    <span className="mr-2 inline-block h-[7px] w-[7px] rounded-full bg-teal align-[1px] shadow-[0_0_8px_#2dd4bf]" />
                    {t("mercadoHoje.hero.reference")}{" "}
                    <b className="font-normal text-paper">
                      {fmt.longDate(ref)}
                    </b>
                  </span>
                  <span>
                    {t("mercadoHoje.hero.updated", {
                      time: fmt.timeBrt(data.generatedAt),
                    })}
                  </span>
                  <span>{t("mercadoHoje.hero.next")}</span>
                </div>
              ) : null}
              {fresh ? <Strip data={fresh} fmt={fmt} /> : null}
              {data && (en ? data.text.en : data.text.pt) ? (
                <>
                  <p className="mt-9 max-w-[52rem] font-serif text-[1.15rem] leading-[1.55] text-paper/85 sm:text-[1.45rem]">
                    <RichText text={en ? data.text.en : data.text.pt} />
                  </p>
                  <div className="mt-2.5 font-mono text-[0.7rem] text-paper/55">
                    {t("mercadoHoje.hero.rules")}
                  </div>
                </>
              ) : null}
              {!data ? (
                <p className="mt-10 text-paper/55" role="status">
                  {error
                    ? t("mercadoHoje.hero.error")
                    : t("mercadoHoje.hero.loading")}
                </p>
              ) : null}
            </div>
            <p className="mt-6 max-w-[34rem] text-[0.78rem] leading-relaxed text-paper/50">
              {t("mercadoHoje.hero.disclaimer")}
            </p>
          </div>
        </header>

        <section
          id="painel"
          className="scroll-mt-20 border-b border-white/10 bg-ink py-14 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
              <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">
                {t("mercadoHoje.panel.title")}
              </h2>
              <p className="max-w-md text-[0.92rem] text-paper/55">
                {t("mercadoHoje.panel.side")}
              </p>
            </div>
            {fresh && (panels || fresh.bcb) ? (
              <div
                className={`mt-11 grid grid-cols-1 border-t border-l border-white/10 sm:grid-cols-2 ${panels % 2 ? "sm:[&>article:last-of-type]:col-span-2" : ""}`}
              >
                {fresh.hmm ? (
                  <HmmBlock h={fresh.hmm} fmt={fmt} warn={warn("hmm")} />
                ) : null}
                {fresh.rrg?.presets.setbr ? (
                  <RrgBlock r={fresh.rrg} fmt={fmt} warn={warn("rrg")} />
                ) : null}
                {fresh.b3 ? (
                  <B3Block b={fresh.b3} fmt={fmt} warn={warn("b3")} />
                ) : null}
                {fresh.pairs ? (
                  <PairsBlock p={fresh.pairs} fmt={fmt} warn={warn("pairs")} />
                ) : null}
                {fresh.bcb ? (
                  <BcbBlock
                    b={fresh.bcb}
                    fmt={fmt}
                    kept={
                      data?.sources?.bcb?.status === "fallback"
                        ? ["selic", "cdi", "ipca12"]
                        : (data?.sources?.bcb?.kept ?? [])
                    }
                    isFresh={(k, d) =>
                      daysBetween(d, today) <= (ITEM_STALE[k] ?? 7)
                    }
                  />
                ) : null}
              </div>
            ) : data ? (
              <p className="mt-10 text-paper/55">
                {t("mercadoHoje.hero.empty")}
              </p>
            ) : null}
          </div>
        </section>

        <section
          id="como"
          className="scroll-mt-20 border-b border-white/10 bg-ink py-14 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
              <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">
                {t("mercadoHoje.how.title")}
              </h2>
              <p className="max-w-md text-[0.92rem] text-paper/55">
                {t("mercadoHoje.how.side")}
              </p>
            </div>
            <ol className="mt-9 grid grid-cols-1 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="pt-5 pr-6">
                  <div className="font-mono text-[0.72rem] tracking-[0.14em] text-paper/50 uppercase">
                    {t(`mercadoHoje.how.s${n}t`)}
                  </div>
                  <p
                    className="mt-2 text-[0.9rem] leading-relaxed text-paper/60 [&_code]:font-mono [&_code]:text-[0.78rem] [&_code]:text-teal-dim"
                    // textos fixos das traduções (com <code>), sem dado externo
                    dangerouslySetInnerHTML={{
                      __html: t(`mercadoHoje.how.s${n}`),
                    }}
                  />
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-[44rem] text-[0.82rem] text-paper/55">
              {t("mercadoHoje.how.future")}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
