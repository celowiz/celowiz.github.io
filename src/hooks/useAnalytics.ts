// src/hooks/useAnalytics.ts
import { useEffect, useCallback } from 'react';
import {
  GA_MEASUREMENT_ID,
  ensureGtagStub,
  trackBookClick as trackGaBookClick,
  trackEvent as trackGaEvent,
} from '../lib/analytics.mjs';
import type { BookClickInput } from '../lib/analytics.mjs';

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const useAnalytics = () => {
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    trackGaEvent(event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }, []);

  const trackPageView = useCallback((pagePath: string) => {
    ensureGtagStub();
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      page_path: pagePath,
    });
  }, []);

  const trackSectionView = useCallback((sectionName: string) => {
    trackEvent({
      action: 'section_view',
      category: 'engagement',
      label: sectionName,
    });
  }, [trackEvent]);

  const trackProjectClick = useCallback((projectName: string, projectType: 'demo' | 'code') => {
    trackEvent({
      action: `project_${projectType}_click`,
      category: 'engagement',
      label: projectName,
    });
  }, [trackEvent]);

  const trackBookClick = useCallback((book: BookClickInput) => {
    trackGaBookClick(book);
  }, []);

  const trackLanguageChange = useCallback((newLanguage: string) => {
    trackEvent({
      action: 'language_change',
      category: 'user_preference',
      label: newLanguage,
    });
  }, [trackEvent]);

  const trackSearch = useCallback((searchTerm: string, category?: string) => {
    trackEvent({
      action: 'search',
      category: 'engagement',
      label: `${category || 'general'}:${searchTerm}`,
    });
  }, [trackEvent]);

  const trackPerformance = useCallback((metric: string, value: number) => {
    trackEvent({
      action: 'performance_metric',
      category: 'technical',
      label: metric,
      value: Math.round(value),
    });
  }, [trackEvent]);

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEvent({
          action: 'page_hidden',
          category: 'engagement',
        });
      } else {
        trackEvent({
          action: 'page_visible',
          category: 'engagement',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [trackEvent]);

  // Track performance metrics
  useEffect(() => {
    const trackWebVitals = () => {
      // LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          trackPerformance('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            trackPerformance('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          trackPerformance('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
        };
      }
    };

    trackWebVitals();
  }, [trackPerformance]);

  return {
    trackEvent,
    trackPageView,
    trackSectionView,
    trackProjectClick,
    trackBookClick,
    trackLanguageChange,
    trackSearch,
    trackPerformance,
  };
};
