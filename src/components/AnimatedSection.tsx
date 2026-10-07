import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const reduced = usePrefersReducedMotion();
  const { elementRef, entry } = useIntersectionObserver({
    threshold: 0.12,
    freezeOnceVisible: true,
  }) as { elementRef: RefObject<HTMLDivElement | null>; entry?: IntersectionObserverEntry };

  const [isVisible, setIsVisible] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setIsVisible(true);
      return;
    }
    if (entry?.isIntersecting) {
      const timer = window.setTimeout(() => setIsVisible(true), delay);
      return () => window.clearTimeout(timer);
    }
  }, [entry, delay, reduced]);

  const motionClass = reduced
    ? ''
    : isVisible
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-3';

  return (
    <div
      ref={elementRef}
      className={`${reduced ? '' : 'transition-all duration-500 ease-out'} ${motionClass} ${className}`}
    >
      {children}
    </div>
  );
};
