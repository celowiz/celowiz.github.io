import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Search, X } from 'lucide-react';
import { trackResourceClick } from '../lib/analytics.mjs';
import { useAnalytics } from '../hooks/useAnalytics';
import { useActiveSection } from '../hooks/useActiveSection';
import { ALL, NO_FLAGS, domId, matchItem, readUrlState, toSearch, type FilterState } from '../lib/secondBrain.mjs';
import { cn } from '../lib/cn';
import type { SecondBrainCategory, SecondBrainData, SecondBrainItem } from '../types/SecondBrain';
import { Highlight } from './Highlight';

const FLAG_TONE: Record<string, string> = {
  bot: 'border-amber-400/30 text-amber-300',
  archived: 'border-zinc-400/35 text-zinc-400',
  login: 'border-blue-400/35 text-blue-300',
};

export function useCategoryLabel() {
  const { t } = useTranslation();
  return (cat: SecondBrainCategory) =>
    `${cat.emoji ? `${cat.emoji} ` : ''}${t(`secondBrain.categories.${cat.id}`, { defaultValue: cat.name })}`;
}

export function trackItemClick(item: SecondBrainItem) {
  trackResourceClick({ name: item.n, domain: item.d, category: item.c, subcategory: item.s, url: item.u });
}

function StatusBadge({ flag }: { flag: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'rounded-full border border-white/10 px-2 py-0.5 font-mono text-[0.7rem] whitespace-nowrap text-paper/65',
        FLAG_TONE[flag],
      )}
    >
      {t(`secondBrain.status.${flag}`, { defaultValue: flag })}
    </span>
  );
}

const chipBase =
  'h-8 shrink-0 cursor-pointer rounded-lg px-3 text-[0.82rem] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-teal';
const chipOff = 'border border-white/10 bg-white/[0.03] text-paper/70 hover:border-white/20';
const chipOn = 'bg-teal/15 text-teal';

export default function Resources({ data }: { data: SecondBrainData }) {
  const { t } = useTranslation();
  const catLabel = useCategoryLabel();
  const { trackSearch } = useAnalytics();
  const [state, setState] = useState<FilterState>(() => readUrlState(window.location.search));
  const [copied, setCopied] = useState(false);
  const deferredQ = useDeferredValue(state.q);
  const inputRef = useRef<HTMLInputElement>(null);
  const { categories, items } = data;

  const subLabel = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => c.subs.forEach((s) => (map[s.id] = s.name)));
    return map;
  }, [categories]);

  const flags = useMemo(() => {
    const present = new Set(items.flatMap((i) => i.f));
    return ['bot', 'archived', 'login', 'broken', 'offline', 'nourl', 'duplicate'].filter((f) => present.has(f));
  }, [items]);

  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => (map[i.c] = (map[i.c] ?? 0) + 1));
    return map;
  }, [items]);

  const query = deferredQ.trim();
  const visible = useMemo(
    () => items.filter((i) => matchItem(i, { ...state, q: query }, subLabel[i.s])),
    [items, state, query, subLabel],
  );
  const filtered = Boolean(query) || state.cat !== ALL || state.status !== ALL;

  // URL compartilhável: ?q=&cat=&status= (mantém o #hash).
  useEffect(() => {
    const { pathname, hash } = window.location;
    window.history.replaceState(null, '', `${pathname}${toSearch({ ...state, q: state.q.trim() })}${hash}`);
  }, [state]);

  useEffect(() => {
    if (query.length < 3) return;
    const id = window.setTimeout(() => trackSearch(query, 'second_brain'), 1500);
    return () => window.clearTimeout(id);
  }, [query, trackSearch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const groups = useMemo(
    () =>
      categories
        .map((cat) => {
          const catItems = visible.filter((i) => i.c === cat.id);
          const subs = cat.subs
            .map((sub) => ({ sub, items: catItems.filter((i) => i.s === sub.id) }))
            .filter((g) => g.items.length > 0);
          return { cat, count: catItems.length, subs };
        })
        .filter((g) => g.count > 0),
    [categories, visible],
  );

  const activeCat = useActiveSection(groups.map((g) => domId('cat', g.cat.id)));
  const set = (patch: Partial<FilterState>) => setState((prev) => ({ ...prev, ...patch }));
  const statusLabel = (s: string) =>
    s === ALL ? t('secondBrain.resources.statusAll') : s === NO_FLAGS ? t('secondBrain.resources.statusOk') : t(`secondBrain.status.${s}`);
  const statusOptions = [ALL, NO_FLAGS, ...flags];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard indisponível: a URL já está na barra de endereço
    }
  };

  return (
    <section id="resources" className="scroll-mt-20 border-b border-white/10 bg-ink pt-18 pb-20 sm:pt-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">{t('secondBrain.resources.title')}</h2>
          <p className="max-w-md text-[0.92rem] text-paper/55">{t('secondBrain.resources.intro')}</p>
        </div>

        <div className="sticky top-20 z-30 mt-8 border-b border-white/10 bg-ink/90 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <label className="relative max-w-[30rem] min-w-0 flex-1">
              <span className="sr-only">{t('secondBrain.resources.searchAria')}</span>
              <Search aria-hidden="true" className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-paper/40" />
              <input
                ref={inputRef}
                type="text"
                inputMode="search"
                value={state.q}
                onChange={(e) => set({ q: e.target.value })}
                placeholder={t('secondBrain.resources.searchPlaceholder', { count: items.length })}
                className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] pr-10 pl-10 text-[0.95rem] text-paper placeholder:text-paper/50 focus:border-teal focus:outline-none"
              />
              {state.q ? (
                <button
                  type="button"
                  onClick={() => set({ q: '' })}
                  aria-label={t('secondBrain.resources.clear')}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-paper/50 hover:text-paper"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-white/10 px-1.5 font-mono text-[0.7rem] text-paper/50 sm:block">
                  /
                </kbd>
              )}
            </label>

            <div
              role="group"
              aria-label={t('secondBrain.resources.statusAria')}
              className="hidden h-10 overflow-hidden rounded-lg border border-white/10 lg:flex"
            >
              {statusOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={state.status === s}
                  onClick={() => set({ status: s })}
                  className={cn(
                    'cursor-pointer border-r border-white/10 px-3.5 text-[0.82rem] whitespace-nowrap last:border-r-0',
                    state.status === s ? 'bg-teal/12 text-teal' : 'text-paper/65 hover:text-paper',
                  )}
                >
                  {statusLabel(s)}
                </button>
              ))}
            </div>
            <select
              aria-label={t('secondBrain.resources.statusAria')}
              value={state.status}
              onChange={(e) => set({ status: e.target.value })}
              className="h-10 shrink-0 rounded-lg border border-white/10 bg-[#0d0d0f] px-2 text-[0.85rem] text-paper lg:hidden"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {t('secondBrain.resources.statusSelect', { label: statusLabel(s) })}
                </option>
              ))}
            </select>

            <div className="ml-auto hidden items-center gap-3 font-mono text-[0.78rem] whitespace-nowrap text-paper/50 md:flex">
              <span>
                <b className="font-medium text-paper">{visible.length}</b>{' '}
                {t('secondBrain.resources.count', { total: items.length })}
              </span>
              {filtered ? (
                <button
                  type="button"
                  onClick={copyLink}
                  title={t('secondBrain.resources.copyLink')}
                  aria-label={t('secondBrain.resources.copyLink')}
                  className={cn('cursor-pointer rounded p-1 hover:text-teal', copied && 'text-teal')}
                >
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only" aria-live="polite">{copied ? t('secondBrain.resources.copied') : ''}</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              aria-pressed={state.cat === ALL}
              onClick={() => set({ cat: ALL })}
              className={cn(chipBase, state.cat === ALL ? chipOn : chipOff)}
            >
              {t('secondBrain.resources.allCategories')}
              <i className="ml-1.5 font-mono text-[0.7rem] not-italic opacity-75">{items.length}</i>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                aria-pressed={state.cat === cat.id}
                onClick={() => set({ cat: cat.id })}
                className={cn(chipBase, state.cat === cat.id ? chipOn : chipOff)}
              >
                {catLabel(cat)}
                <i className="ml-1.5 font-mono text-[0.7rem] not-italic opacity-75">{totals[cat.id] ?? 0}</i>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-14 md:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="sticky top-60 hidden max-h-[calc(100vh-16rem)] self-start overflow-auto text-[0.84rem] [scrollbar-width:thin] md:block">
            <div className="mb-3 font-mono text-[0.7rem] tracking-[0.14em] text-paper/50 uppercase">
              {t('secondBrain.resources.toc')}
            </div>
            <nav aria-label={t('secondBrain.resources.toc')}>
              {groups.map(({ cat, count, subs }) => (
                <div key={cat.id}>
                  <a
                    href={`#${domId('cat', cat.id)}`}
                    className={cn(
                      'flex justify-between gap-2 border-l py-1.5 pl-3 transition-colors',
                      activeCat === domId('cat', cat.id)
                        ? 'border-teal text-teal'
                        : 'border-white/10 text-paper/60 hover:text-paper',
                    )}
                  >
                    <span>{catLabel(cat)}</span>
                    <i className="font-mono text-[0.7rem] not-italic opacity-90">{count}</i>
                  </a>
                  {filtered
                    ? subs
                        .filter((g) => g.sub.name)
                        .map((g) => (
                          <a
                            key={g.sub.id}
                            href={`#${domId('sub', g.sub.id)}`}
                            className="flex justify-between gap-2 border-l border-white/10 py-1 pl-6 text-[0.78rem] text-paper/50 hover:text-paper"
                          >
                            <span>{g.sub.name}</span>
                            <i className="font-mono text-[0.7rem] not-italic">{g.items.length}</i>
                          </a>
                        ))
                    : null}
                </div>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            {groups.length === 0 ? (
              <div className="py-12 text-paper/55">
                <p>{t('secondBrain.resources.empty')}</p>
                <button
                  type="button"
                  onClick={() => setState({ q: '', cat: ALL, status: ALL })}
                  className="mt-4 border-b border-teal/50 pb-0.5 text-teal hover:border-teal"
                >
                  {t('secondBrain.resources.reset')}
                </button>
              </div>
            ) : null}
            {groups.map(({ cat, count, subs }) => (
              <div key={cat.id} id={domId('cat', cat.id)} className="mb-14 scroll-mt-60">
                <h3 className="flex items-baseline gap-3 font-serif text-3xl text-paper">
                  {catLabel(cat)}
                  <i className="font-mono text-[0.78rem] not-italic text-paper/50">{count}</i>
                </h3>
                {subs.map(({ sub, items: subItems }) => (
                  <div key={sub.id} id={domId('sub', sub.id)} className="scroll-mt-60">
                    <h4 className="mt-8 border-b border-white/10 pb-2.5 font-mono text-[0.75rem] font-medium tracking-[0.13em] text-paper/50 uppercase">
                      {sub.name ? (
                        <>
                          {sub.emoji ? <span className="text-teal/85">{sub.emoji} </span> : null}
                          <Highlight text={sub.name} query={query} /> · {subItems.length}
                        </>
                      ) : (
                        t('secondBrain.resources.items', { count: subItems.length })
                      )}
                    </h4>
                    <ul>
                      {subItems.map((item) => (
                        <li
                          key={`${item.s}|${item.u}|${item.n}`}
                          className={cn(
                            'grid grid-cols-1 items-baseline gap-x-6 gap-y-1.5 border-b border-white/[0.06] py-3.5 transition-colors hover:bg-white/[0.02] sm:grid-cols-[minmax(0,1fr)_auto]',
                            item.lvl ? 'pl-6' : '',
                          )}
                        >
                          <div className="min-w-0">
                            {item.lvl ? <span aria-hidden="true" className="-ml-5 mr-1.5 text-paper/30">↳</span> : null}
                            <a
                              href={item.u}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => trackItemClick(item)}
                              className="text-[0.98rem] [overflow-wrap:anywhere] text-paper transition-colors hover:text-teal"
                            >
                              <Highlight text={item.n} query={query} />
                            </a>
                            <span className="ml-2.5 font-mono text-[0.72rem] text-paper/50">
                              <Highlight text={item.d} query={query} />
                            </span>
                            {item.x ? (
                              <p className="mt-1 text-[0.86rem] leading-relaxed [overflow-wrap:anywhere] text-paper/58">
                                <Highlight text={item.x} query={query} />
                              </p>
                            ) : null}
                          </div>
                          {item.f.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {item.f.map((flag) => (
                                <StatusBadge key={flag} flag={flag} />
                              ))}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
