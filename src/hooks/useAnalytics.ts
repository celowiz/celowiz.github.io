// src/hooks/useAnalytics.ts
import { useEffect, useCallback } from 'react';
import {
  GA_MEASUREMENT_ID,
  ensureGtagStub,
  trackBookClick as trackGaBookClick,
  trackEvent as trackGaEvent,
  initVisibilityTracking,
  initWebVitals,
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

  // Visibilidade e Web Vitals: registro único por página (vários componentes usam este hook
  // e o StrictMode monta efeitos duas vezes; antes cada instância criava seus observers).
  useEffect(() => {
    initVisibilityTracking();
    initWebVitals();
  }, []);

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
