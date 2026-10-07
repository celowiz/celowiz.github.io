import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import type { TimelineEntry } from '../lib/timeline';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function Timeline({ items }: { items: TimelineEntry[] }) {
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const listRef = useRef<HTMLOListElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const list = listRef.current;
    const path = pathRef.current;
    const svg = svgRef.current;
    if (!list || !path || !svg) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const height = Math.max(list.offsetHeight, 24);
      svg.setAttribute('height', String(height));
      svg.setAttribute('viewBox', `0 0 24 ${height}`);
      path.setAttribute('d', `M 12 12 L 12 ${height - 12}`);

      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      if (reduced) {
        path.style.strokeDashoffset = '0';
        return;
      }

      const rect = list.getBoundingClientRect();
      const start = window.innerHeight * 0.78;
      const progress = clamp((start - rect.top) / Math.max(rect.height, 1), 0, 1);
      path.style.strokeDashoffset = `${length * (1 - progress)}`;
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(list);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resize.disconnect();
    };
  }, [items, reduced]);

  return (
    <ol ref={listRef} className="relative ml-2 pl-10">
      <div className="absolute top-2 bottom-2 left-[11px] w-px bg-white/10" aria-hidden="true" />
      <svg
        ref={svgRef}
        className="pointer-events-none absolute top-0 left-0 text-teal"
        width="24"
        height="100%"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d="M 12 12 L 12 24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {items.map((item) => (
        <li key={`${item.kind}-${item.company}-${item.start}`} className="relative py-5">
          <span
            className="absolute top-7 -left-10 h-2.5 w-2.5 rounded-full border border-teal bg-ink"
            aria-hidden="true"
          />
          <p className="mb-1 text-[11px] font-medium tracking-[0.18em] text-teal uppercase">
            {item.kind === 'work' ? t('about.workLabel') : t('about.educationLabel')}
          </p>
          <h4 className="text-lg font-medium text-paper">
            {item.company}
            <span className="text-paper/45"> · {item.role}</span>
          </h4>
          <p className="mt-1 text-sm text-paper/50">{item.period}</p>
        </li>
      ))}
    </ol>
  );
}
