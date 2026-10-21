import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Home, Info, LayoutGrid } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import Navbar, { type NavSection } from '../components/Navbar';
import Footer from '../components/Footer';
import { trackEvent } from '../lib/analytics.mjs';
import { DEMOS, parseDemoHash, type DemoDef, type OpenTrigger } from './demos';

const CODE_URL = 'https://github.com/celowiz/celowiz.github.io/tree/main/src/lab';
const GH = 'https://github.com/celowiz';
const PAGES = 'https://celowiz.github.io';
const REAL_PROJECTS = ['monitor-b3', 'rrg', 'hmm-regimes', 'pairs-trading', 'quant-notebooks'] as const;
// Todo demo da lista tem componente, então o contador é "N ativas".
const ACTIVE = DEMOS.length;

export type { OpenTrigger };

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="border-white/[0.06] pt-5 pr-10 max-sm:border-b max-sm:pr-0 max-sm:pb-4 sm:mr-10 sm:border-r sm:last:mr-0 sm:last:border-r-0">
      <div className="font-serif text-[2.4rem] leading-none text-paper max-sm:text-[2rem]">{value}</div>
      <div className="mt-2 text-[0.78rem] tracking-[0.12em] text-paper/55 uppercase">{label}</div>
    </div>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <header id="hero" className="border-b border-white/10 bg-ink pt-26 pb-16 sm:pt-38">
      <div className="hero-copy mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-mono text-sm tracking-wide text-teal sm:text-[0.9rem]">
          <span className="select-none text-paper/35">$ </span>
          {t('lab.hero.prompt')}
        </p>
        <h1 className="mt-5 font-serif text-5xl leading-[1.02] tracking-tight text-paper sm:text-[5.25rem]">
          {t('lab.hero.title')}
        </h1>
        <p className="mt-7 max-w-[44rem] text-[1.05rem] leading-relaxed text-paper/70 sm:text-xl">
          {t('lab.hero.description')}
        </p>
        <div className="mt-12 grid grid-cols-2 gap-x-6 border-t border-white/10 sm:flex sm:flex-wrap sm:gap-x-0">
          <Stat value={ACTIVE} label={t('lab.hero.demos', { count: ACTIVE })} />
          <Stat value={0} label={t('lab.hero.servers')} />
          <Stat value="100%" label={t('lab.hero.inBrowser')} />
          <Stat value={REAL_PROJECTS.length} label={t('lab.hero.related')} />
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 text-[0.95rem]">
          <a
            href="#gallery"
            className="border-b border-teal/50 pb-0.5 text-teal transition-colors hover:border-teal hover:text-teal-dim"
          >
            {t('lab.hero.open')}
          </a>
          <a
            href={CODE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('project_code_click', { event_category: 'engagement', event_label: 'lab' })}
            className="inline-flex items-center gap-2 text-paper/70 transition-colors hover:text-paper"
          >
            <SiGithub aria-hidden="true" className="h-3.5 w-3.5" />
            {t('lab.hero.github')} ↗
          </a>
          <span className="font-mono text-[0.78rem] text-paper/55">{t('lab.hero.tech')}</span>
        </div>
        <p className="mt-6 max-w-[44rem] text-[0.82rem] leading-relaxed text-paper/55">{t('lab.hero.disclaimer')}</p>
      </div>
    </header>
  );
}

function RepoLink({ repo }: { repo: string }) {
  const { t } = useTranslation();
  return (
    <a
      href={`${GH}/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('lab.demos.repoAria', { repo })}
      onClick={() => trackEvent('project_code_click', { event_category: 'engagement', event_label: repo, page: 'lab' })}
      className="font-mono text-[0.72rem] text-paper/55 transition-colors hover:text-paper"
    >
      {repo} ↗
    </a>
  );
}

function Gallery({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const pill = 'rounded-full border border-teal/40 px-2 py-0.5 font-mono text-[0.66rem] tracking-[0.1em] text-teal uppercase';
  return (
    <section id="gallery" className="scroll-mt-20 border-b border-white/10 bg-ink py-18 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">{t('lab.demos.title')}</h2>
          <p className="max-w-md text-[0.92rem] text-paper/60">{t('lab.demos.intro')}</p>
        </div>
        <ul className="mt-12 grid grid-cols-1 border-t border-l border-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {DEMOS.map(({ id, key, icon: Icon, repo }) => {
            const tags = t(`lab.demos.items.${key}.tags`, { returnObjects: true }) as string[];
            return (
              <li key={id} className="flex flex-col gap-3.5 border-r border-b border-white/10 p-7 sm:min-h-[15.5rem]">
                <div className="flex items-center justify-between">
                  <Icon aria-hidden="true" className="h-[22px] w-[22px] text-teal/80" strokeWidth={1.75} />
                  <span className={pill}>{t('lab.demos.live')}</span>
                </div>
                <h3 className="text-[1.15rem] font-medium text-paper">{t(`lab.demos.items.${key}.title`)}</h3>
                <p className="text-[0.95rem] leading-relaxed text-paper/65">{t(`lab.demos.items.${key}.description`)}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {Array.isArray(tags)
                    ? tags.map((tag) => (
                        <li key={tag} className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[0.66rem] text-paper/65">
                          {tag}
                        </li>
                      ))
                    : null}
                </ul>
                <div className="mt-auto flex items-center justify-between pt-1 text-[0.88rem]">
                  <a
                    href={`#${id}`}
                    onClick={() => onOpen(id)}
                    aria-label={`${t('lab.demos.open').replace(' →', '')}: ${t(`lab.demos.items.${key}.title`)}`}
                    className="border-b border-teal/50 pb-0.5 text-teal transition-colors hover:border-teal hover:text-teal-dim"
                  >
                    {t('lab.demos.open')}
                  </a>
                  <RepoLink repo={repo} />
                </div>
              </li>
            );
          })}
          <li className="flex flex-col gap-3.5 border-r border-b border-white/10 p-7">
            <p className="font-mono text-[0.72rem] tracking-[0.14em] text-paper/55 uppercase">{t('lab.demos.real.eyebrow')}</p>
            <p className="text-[0.95rem] leading-relaxed text-paper/65">{t('lab.demos.real.description')}</p>
            <ul className="font-mono text-[0.8rem] leading-[2.05]">
              {REAL_PROJECTS.map((p) => (
                <li key={p}>
                  <a
                    href={`${PAGES}/${p}/`}
                    onClick={() => trackEvent('project_click', { event_category: 'engagement', event_label: p, page: 'lab' })}
                    className="text-teal transition-colors hover:text-teal-dim"
                  >
                    {p}
                  </a>{' '}
                  <span className="text-paper/55">· {t(`lab.demos.real.${p}`)}</span>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </section>
  );
}

function DemoSection({
  demo,
  open,
  initialCode,
  onOpen,
}: {
  demo: DemoDef;
  open: OpenTrigger | undefined;
  initialCode: boolean;
  onOpen: (id: string, t: OpenTrigger) => void;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const { id, key, Component } = demo;
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  // Carrega quando a seção chega a ~600px da tela.
  useEffect(() => {
    if (open || !ref.current) return;
    if (!('IntersectionObserver' in window)) {
      onOpen(id, 'scroll');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onOpen(id, 'scroll');
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [open, onOpen, id]);

  return (
    <section
      id={id}
      ref={ref}
      // título logo abaixo da barra: compensa o scroll-padding do html e o padding da seção
      className="scroll-mt-[-4.5rem] border-b border-white/10 bg-ink py-18 sm:scroll-mt-[-6rem] sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-mono text-[0.78rem] text-paper/55">
          <a href="#gallery" className="transition-colors hover:text-teal">
            lab
          </a>{' '}
          / {id}
        </p>
        <div className="mt-3.5 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">{t(`lab.demos.items.${key}.title`)}</h2>
          <p className="max-w-md text-[0.92rem] leading-relaxed text-paper/60">{t(`lab.demos.items.${key}.intro`)}</p>
        </div>
        {/* Reserva a altura medida do demo até ele montar: deep links não deslocam o layout. */}
        <div className={ready ? undefined : `flex flex-col ${initialCode ? demo.minHCode : demo.minH}`}>
          {open ? (
            <Suspense fallback={<DemoPlaceholder label={t('lab.mc.loading')} />}>
              <Component trigger={open} initialCode={initialCode} />
              <Mounted onMount={markReady} />
            </Suspense>
          ) : (
            <DemoPlaceholder
              label={t('lab.mc.loading')}
              action={
                <button
                  type="button"
                  onClick={() => onOpen(id, 'click')}
                  className="rounded-lg border border-teal/45 px-3.5 py-2 text-sm text-teal"
                >
                  {t('lab.mc.load')}
                </button>
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}

function Mounted({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return null;
}

function DemoPlaceholder({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div
      className="mt-10 flex min-h-[24rem] flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-white/10 text-sm text-paper/55"
      role="status"
    >
      <span>{label}</span>
      {action}
    </div>
  );
}

function How() {
  const { t } = useTranslation();
  return (
    <section id="how" className="scroll-mt-20 bg-ink py-18 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">{t('lab.how.title')}</h2>
        <div className="mt-10 grid grid-cols-1 border-t border-white/10 md:grid-cols-3">
          {(['1', '2', '3'] as const).map((k) => (
            <div key={k} className="pt-6 pr-7">
              <p className="font-mono text-[0.72rem] tracking-[0.14em] text-paper/55 uppercase">{t(`lab.how.${k}.title`)}</p>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-paper/65">{t(`lab.how.${k}.text`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LabPage() {
  const { t, i18n } = useTranslation();
  const initial = typeof window !== 'undefined' ? parseDemoHash(window.location.hash) : null;
  const [open, setOpen] = useState<Record<string, OpenTrigger>>(() => (initial ? { [initial.id]: 'hash' } : {}));
  const [codeFor] = useState(initial?.code ? initial.id : '');

  const openDemo = useCallback((id: string, trigger: OpenTrigger) => {
    setOpen((o) => (o[id] ? o : { ...o, [id]: trigger }));
  }, []);

  // Link direto digitado depois do carregamento (/lab/#kelly).
  useEffect(() => {
    const onHash = () => {
      const h = parseDemoHash(window.location.hash);
      if (h) openDemo(h.id, 'hash');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [openDemo]);

  useEffect(() => {
    document.title = t('lab.metaTitle');
  }, [t, i18n.language]);

  // "Demos" cobre a galeria e as seções de cada demo (o wrapper #demos).
  const sections: NavSection[] = [
    { id: 'hero', label: t('lab.nav.hero'), icon: Home },
    { id: 'demos', label: t('lab.nav.demos'), icon: LayoutGrid },
    { id: 'how', label: t('lab.nav.how'), icon: Info },
  ];

  return (
    <div className="bg-ink pb-24 sm:pb-0">
      <a
        href="/"
        className="fixed top-10 left-4 z-50 flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-full px-2 text-sm text-paper/60 transition-colors hover:text-teal sm:left-6"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        <span>celowiz</span>
        <span className="sr-only">{t('lab.back')}</span>
      </a>
      <Navbar sections={sections} />
      <main>
        <Hero />
        <div id="demos" className="scroll-mt-20">
          <Gallery onOpen={(id) => openDemo(id, 'click')} />
          {DEMOS.map((d) => (
            <DemoSection key={d.id} demo={d} open={open[d.id]} initialCode={codeFor === d.id} onOpen={openDemo} />
          ))}
        </div>
        <How />
      </main>
      <Footer />
    </div>
  );
}
