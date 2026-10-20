import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, Home, List, Route } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import Navbar, { type NavSection } from '../components/Navbar';
import Footer from '../components/Footer';
import Bookshelf from '../sections/Bookshelf';
import { trackEvent } from '../lib/analytics.mjs';
import { domId } from '../lib/secondBrain.mjs';
import type { Book } from '../types/Book';
import type { SecondBrainData } from '../types/SecondBrain';
import Resources, { trackItemClick } from './Resources';
import { TRAIL } from './trail';

const REPO_URL = 'https://github.com/celowiz/second-brain';

function useJson<T>(url: string) {
  const [state, setState] = useState<{ data: T | null; error: boolean }>({ data: null, error: false });
  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<T>;
      })
      .then((data) => alive && setState({ data, error: false }))
      .catch(() => alive && setState({ data: null, error: true }));
    return () => {
      alive = false;
    };
  }, [url]);
  return state;
}

function Stat({ value, label }: { value: number | undefined; label: string }) {
  return (
    <div className="border-white/[0.06] pt-5 pr-10 max-sm:border-b max-sm:pr-0 max-sm:pb-4 sm:mr-10 sm:border-r sm:last:mr-0 sm:last:border-r-0">
      <div className="font-serif text-[2.4rem] leading-none text-paper max-sm:text-[2rem]">{value ?? '—'}</div>
      <div className="mt-2 text-[0.78rem] tracking-[0.12em] text-paper/50 uppercase">{label}</div>
    </div>
  );
}

function Hero({ data, bookCount }: { data: SecondBrainData | null; bookCount?: number }) {
  const { t, i18n } = useTranslation();
  const updated = useMemo(() => {
    if (!data?.generatedAt) return null;
    const date = new Date(data.generatedAt);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(i18n.language.startsWith('en') ? 'en-US' : 'pt-BR', {
      dateStyle: 'medium',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
  }, [data?.generatedAt, i18n.language]);

  return (
    <header id="hero" className="border-b border-white/10 bg-ink pt-26 pb-16 sm:pt-38">
      <div className="hero-copy mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-mono text-sm tracking-wide text-teal sm:text-[0.9rem]">
          <span className="select-none text-paper/35">$ </span>
          {t('secondBrain.hero.prompt')}
        </p>
        <h1 className="mt-5 font-serif text-5xl leading-[1.02] tracking-tight text-paper sm:text-[5.25rem]">
          {t('secondBrain.hero.title')}
        </h1>
        <p className="mt-7 max-w-[44rem] text-[1.05rem] leading-relaxed text-paper/70 sm:text-xl">
          {t('secondBrain.hero.description')}
        </p>
        <div className="mt-12 grid grid-cols-2 border-t border-white/10 sm:flex sm:flex-wrap">
          <Stat value={data?.counts.links} label={t('secondBrain.hero.links')} />
          <Stat value={data?.counts.categories} label={t('secondBrain.hero.categories')} />
          <Stat value={data?.counts.subcategories} label={t('secondBrain.hero.subcategories')} />
          <Stat value={bookCount} label={t('secondBrain.hero.books')} />
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 text-[0.95rem]">
          <a
            href="#resources"
            className="border-b border-teal/50 pb-0.5 text-teal transition-colors hover:border-teal hover:text-teal-dim"
          >
            {t('secondBrain.hero.explore')}
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent('project_code_click', { event_category: 'engagement', event_label: 'second-brain' })
            }
            className="inline-flex items-center gap-2 text-paper/70 transition-colors hover:text-paper"
          >
            <SiGithub aria-hidden="true" className="h-3.5 w-3.5" />
            {t('secondBrain.hero.github')} ↗
          </a>
          {updated ? (
            <span className="font-mono text-[0.78rem] text-paper/40">
              {t('secondBrain.hero.updated', { date: updated })}
            </span>
          ) : null}
        </div>
        <p className="mt-6 max-w-[44rem] text-[0.82rem] text-paper/40">{t('secondBrain.hero.disclaimer')}</p>
      </div>
    </header>
  );
}

function StartHere({ data, books }: { data: SecondBrainData; books: Book[] }) {
  const { t } = useTranslation();
  const byUrl = useMemo(() => new Map(data.items.map((i) => [i.u, i])), [data.items]);
  const subs = useMemo(() => new Map(data.categories.flatMap((c) => c.subs.map((s) => [s.id, s]))), [data.categories]);

  const linkClass = 'text-paper transition-colors hover:text-teal';
  const metaClass = 'mt-0.5 block font-mono text-[0.7rem] text-paper/40';

  return (
    <section id="start" className="scroll-mt-20 border-b border-white/10 bg-ink py-18 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">{t('secondBrain.start.title')}</h2>
          <p className="max-w-md text-[0.92rem] text-paper/55">{t('secondBrain.start.intro')}</p>
        </div>
        <ol className="mt-10 grid grid-cols-1 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-5">
          {TRAIL.map((step, idx) => {
            let entries: ReactNode[] = [];
            if ('urls' in step) {
              entries = step.urls
                .map((u) => byUrl.get(u))
                .filter((i) => i !== undefined)
                .map((i) => (
                  <li key={i.u} className="border-t border-white/[0.06] py-2 text-[0.85rem]">
                    <a href={i.u} target="_blank" rel="noopener noreferrer" onClick={() => trackItemClick(i)} className={linkClass}>
                      {i.n}
                    </a>
                    <span className={metaClass}>{i.d}</span>
                  </li>
                ));
            } else if ('sub' in step) {
              const sub = subs.get(step.sub);
              if (sub) {
                const count = data.items.filter((i) => i.s === sub.id).length;
                entries = [
                  <li key={sub.id} className="border-t border-white/[0.06] py-2 text-[0.85rem]">
                    <a href={`#${domId('sub', sub.id)}`} className={linkClass}>
                      {sub.emoji} {sub.name} →
                    </a>
                    <span className={metaClass}>{t('secondBrain.start.subHint', { count })}</span>
                  </li>,
                ];
              }
            } else {
              entries = step.isbns
                .map((isbn) => books.find((b) => b.isbn === isbn || b.id === isbn))
                .filter((b) => b !== undefined)
                .map((b) => (
                  <li key={b.id} className="border-t border-white/[0.06] py-2 text-[0.85rem]">
                    <a href="#bookshelf" className={linkClass}>
                      {b.title.split(':')[0]}
                    </a>
                    <span className={metaClass}>
                      {t('secondBrain.start.booksHint')} · {b.category}
                    </span>
                  </li>
                ));
            }
            return (
              <li
                key={step.key}
                className="border-white/[0.06] pt-6 pr-6 lg:mr-6 lg:border-r lg:last:mr-0 lg:last:border-r-0"
              >
                <div className="font-mono text-xs text-teal">{String(idx + 1).padStart(2, '0')}</div>
                <h3 className="mt-2.5 mb-2 text-[1.05rem] font-medium text-paper">
                  {t(`secondBrain.start.steps.${step.key}.title`)}
                </h3>
                <p className="mb-3.5 text-[0.88rem] leading-relaxed text-paper/60">
                  {t(`secondBrain.start.steps.${step.key}.description`)}
                </p>
                <ul>{entries}</ul>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function Notices({ data }: { data: SecondBrainData | null }) {
  const { t } = useTranslation();
  const flags = useMemo(() => {
    const present = new Set(data?.items.flatMap((i) => i.f) ?? []);
    return ['bot', 'archived', 'login'].filter((f) => present.has(f));
  }, [data]);
  return (
    <section aria-label={t('secondBrain.notice.affiliateTitle')} className="bg-ink py-12 text-[0.84rem] leading-relaxed text-paper/50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 sm:px-8 md:grid-cols-[1.2fr_1fr] md:gap-12">
        <p>
          <strong className="font-medium text-paper/80">{t('secondBrain.notice.affiliateTitle')}</strong>{' '}
          {t('secondBrain.notice.affiliate')} ☕
        </p>
        <div>
          <p>
            <strong className="font-medium text-paper/80">{t('secondBrain.notice.dataTitle')}</strong>{' '}
            {t('secondBrain.notice.data')}
          </p>
          {flags.length ? (
            <p className="mt-2">
              <strong className="font-medium text-paper/80">{t('secondBrain.notice.statusTitle')}</strong>{' '}
              {flags.map((f, i) => (
                <span key={f}>
                  {i ? ' · ' : ''}
                  <span className="font-mono">{t(`secondBrain.status.${f}`)}</span> {t(`secondBrain.statusHelp.${f}`)}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function SecondBrainPage() {
  const { t, i18n } = useTranslation();
  const sb = useJson<SecondBrainData>('/second-brain.json');
  const booksState = useJson<Book[]>('/books.json');
  const books = useMemo(() => (Array.isArray(booksState.data) ? booksState.data : []), [booksState.data]);

  useEffect(() => {
    document.title = t('secondBrain.metaTitle');
  }, [t, i18n.language]);

  // Âncora no carregamento (#bookshelf, #resources…): rola depois que os dados chegam.
  useEffect(() => {
    if (!sb.data || !window.location.hash) return;
    const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (el) window.requestAnimationFrame(() => el.scrollIntoView());
  }, [sb.data]);

  const sections: NavSection[] = [
    { id: 'hero', label: t('secondBrain.nav.hero'), icon: Home },
    { id: 'start', label: t('secondBrain.nav.start'), icon: Route },
    { id: 'resources', label: t('secondBrain.nav.resources'), icon: List },
    { id: 'bookshelf', label: t('secondBrain.nav.bookshelf'), icon: BookOpen },
  ];

  return (
    <div className="bg-ink pb-24 sm:pb-0">
      <a
        href="/"
        className="fixed top-10 left-4 z-50 flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-full px-2 text-sm text-paper/60 transition-colors hover:text-teal sm:left-6"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        <span>celowiz</span>
        <span className="sr-only">{t('secondBrain.back')}</span>
      </a>
      <Navbar sections={sections} />
      <main>
        <Hero data={sb.data} bookCount={booksState.data ? books.length : undefined} />
        {sb.data ? (
          <>
            <StartHere data={sb.data} books={books} />
            <Resources data={sb.data} />
          </>
        ) : (
          <div className="mx-auto max-w-7xl px-5 py-24 text-paper/55 sm:px-8" role="status">
            {sb.error ? t('secondBrain.resources.error') : t('secondBrain.resources.loading')}
          </div>
        )}
        {booksState.data ? (
          <Bookshelf books={books} titleKey="secondBrain.bookshelf.title" descriptionKey="secondBrain.bookshelf.description" />
        ) : null}
        <Notices data={sb.data} />
      </main>
      <Footer />
    </div>
  );
}
