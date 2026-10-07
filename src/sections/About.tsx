import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Timeline from '../components/Timeline';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { asTimelineItems, mergeTimeline } from '../lib/timeline';

function useCounter(to: number, duration = 1200, isVisible = false, reduced = false) {
  const [count, setCount] = useState(reduced ? to : 0);

  useEffect(() => {
    if (reduced) {
      setCount(to);
      return;
    }
    if (!isVisible) return;

    let start = 0;
    const increment = to / (duration / 16);
    const interval = window.setInterval(() => {
      start += increment;
      if (start >= to) {
        setCount(to);
        window.clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => window.clearInterval(interval);
  }, [to, duration, isVisible, reduced]);

  return count;
}

export default function About() {
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const years = useCounter(9, 1200, isVisible, reduced);
  const projects = useCounter(15, 1200, isVisible, reduced);
  const items = mergeTimeline(
    asTimelineItems(t('about.experience', { returnObjects: true })),
    asTimelineItems(t('about.education', { returnObjects: true })),
  );

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="scroll-mt-28 bg-ink py-24 text-paper sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">{t('about.title')}</h2>
        <p className="mt-8 text-lg leading-relaxed text-paper/75">{t('about.description')}</p>
        <p className="mt-6 text-base text-paper/80">
          <span className="tabular-nums text-teal">{years}+</span>{' '}
          {t('about.years').toLowerCase()}
          <span className="text-paper/30"> · </span>
          <span className="tabular-nums text-teal">{projects}+</span>{' '}
          {t('about.projects').toLowerCase()}
        </p>
        <h3 className="mt-16 mb-4 font-serif text-2xl text-paper">{t('about.timelineTitle')}</h3>
        <Timeline items={items} />
      </div>
    </section>
  );
}
