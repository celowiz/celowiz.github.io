// src/components/AnimatedSection.tsx
import { useEffect, useState, ReactNode, RefObject } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'slideInUp';
  delay?: number;
  threshold?: number;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = '',
  animation = 'fadeInUp',
  delay = 0,
  threshold = 0.1,
}) => {
  const { elementRef, entry } = useIntersectionObserver({
    threshold,
    freezeOnceVisible: true,
  }) as { elementRef: RefObject<HTMLDivElement | null>, entry?: IntersectionObserverEntry };

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (entry?.isIntersecting) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [entry, delay]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-1000 ease-out';

    if (!isVisible) {
      switch (animation) {
        case 'fadeInUp':
          return `${baseClasses} opacity-0 translate-y-8`;
        case 'fadeInLeft':
          return `${baseClasses} opacity-0 -translate-x-8`;
        case 'fadeInRight':
          return `${baseClasses} opacity-0 translate-x-8`;
        case 'scaleIn':
          return `${baseClasses} opacity-0 scale-95`;
        case 'slideInUp':
          return `${baseClasses} opacity-0 translate-y-12`;
        default:
          return `${baseClasses} opacity-0 translate-y-8`;
      }
    }

    return `${baseClasses} opacity-100 translate-y-0 translate-x-0 scale-100`;
  };

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} ${className}`}
    >
      {children}
    </div>
  );
};
