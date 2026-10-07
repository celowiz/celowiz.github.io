// Tubelight indicator adapted from Ayushmaan Singh / Serenity UI (MIT)
// https://21st.dev/@ayushmxxn/components/tubelight-navbar
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Code, FolderKanban, Home, User, type LucideIcon } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import { useActiveSection } from '../hooks/useActiveSection';
import { useAnalytics } from '../hooks/useAnalytics';
import { useScrolled } from '../hooks/useScrolled';
import { cn } from '../lib/cn';
import { SECTION_IDS } from '../lib/sections';

type NavItem = {
  id: string;
  name: string;
  url: string;
  icon: LucideIcon;
};

const NAV_ICONS: Record<string, LucideIcon> = {
  hero: Home,
  about: User,
  skills: Code,
  projects: FolderKanban,
  bookshelf: BookOpen,
};

function TubelightNav({
  items,
  activeId,
}: {
  items: NavItem[];
  activeId: string;
}) {
  const reduceMotion = useReducedMotion();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const visualId = pendingId ?? activeId;

  useEffect(() => {
    if (pendingId && pendingId === activeId) setPendingId(null);
  }, [pendingId, activeId]);

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 sm:bottom-auto sm:top-10 sm:-translate-y-1/2">
      <div className="pointer-events-auto flex items-center gap-1 overflow-visible rounded-full border border-white/10 bg-black/40 px-1 py-1 shadow-lg shadow-black/40 backdrop-blur-lg">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = visualId === item.id;

          return (
            <a
              key={item.id}
              href={item.url}
              onClick={() => setPendingId(item.id)}
              className={cn(
                'relative z-0 cursor-pointer rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-5',
                isActive ? 'text-teal' : 'text-paper/70 hover:text-teal',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
                <span className="sr-only">{item.name}</span>
              </span>
              {isActive ? (
                <motion.div
                  layoutId={reduceMotion ? undefined : 'lamp'}
                  className="absolute inset-0 -z-10 w-full rounded-full bg-teal/10"
                  initial={false}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 300, damping: 30 }
                  }
                >
                  <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-teal">
                    {reduceMotion ? null : (
                      <>
                        <div className="absolute -top-2 -left-2 h-6 w-12 rounded-full bg-teal/20 blur-md" />
                        <div className="absolute -top-1 h-6 w-8 rounded-full bg-teal/20 blur-md" />
                        <div className="absolute top-0 left-2 h-4 w-4 rounded-full bg-teal/20 blur-sm" />
                      </>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function Navbar() {
  const { t } = useTranslation();
  const { trackSectionView } = useAnalytics();
  const scrolled = useScrolled(16);
  const activeSection = useActiveSection(SECTION_IDS, trackSectionView);

  const items: NavItem[] = SECTION_IDS.map((id) => ({
    id,
    name: id === 'hero' ? t('navbar.home') : t(`navbar.${id}`),
    url: `#${id}`,
    icon: NAV_ICONS[id],
  }));

  return (
    <nav role="navigation" aria-label={t('navbar.aria')}>
      <div
        className={cn(
          'pointer-events-none fixed inset-x-0 top-0 z-40 h-20 overflow-visible border-b transition-[background-color,border-color,backdrop-filter] duration-300',
          scrolled
            ? 'border-white/10 bg-black/55 backdrop-blur-md'
            : 'border-transparent bg-transparent',
        )}
        aria-hidden="true"
      />
      <TubelightNav items={items} activeId={activeSection} />
      <LanguageToggle scrolled={scrolled} />
    </nav>
  );
}
