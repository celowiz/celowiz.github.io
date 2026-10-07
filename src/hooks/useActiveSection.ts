import { useEffect, useRef, useState } from 'react';

function pickActiveSection(ids: string[]): string {
  const scanLine = window.innerHeight * 0.28;
  let current = ids[0] ?? '';
  let bestAbove = -Infinity;

  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top;
    if (top <= scanLine && top >= bestAbove) {
      bestAbove = top;
      current = id;
    }
  }

  if (bestAbove === -Infinity) {
    for (const id of ids) {
      if (document.getElementById(id)) return id;
    }
  }

  return current;
}

export function useActiveSection(
  sectionIds: readonly string[],
  onChange?: (id: string) => void,
) {
  const [active, setActive] = useState(sectionIds[0] ?? '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const idsKey = sectionIds.join(',');

  useEffect(() => {
    const ids = idsKey.split(',').filter(Boolean);
    const observed = new Set<Element>();
    let frame = 0;

    const commit = (next: string) => {
      if (!next) return;
      setActive((prev) => {
        if (prev !== next) onChangeRef.current?.(next);
        return next;
      });
    };

    const measure = () => {
      frame = 0;
      commit(pickActiveSection(ids));
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    const observer = new IntersectionObserver(schedule, {
      root: null,
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    });

    const attach = () => {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el || observed.has(el)) continue;
        observed.add(el);
        observer.observe(el);
      }
      schedule();
    };

    attach();
    const mutations = new MutationObserver(attach);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
    };
  }, [idsKey]);

  return active;
}
