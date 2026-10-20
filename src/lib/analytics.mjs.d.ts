export const GA_MEASUREMENT_ID: 'G-QCBFGR39WG';
export const BOOK_CLICK_EVENT: 'click_book';
export const RESOURCE_CLICK_EVENT: 'click_resource';

export type AnalyticsWindow = {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  document?: Document;
  location?: Location;
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  setTimeout: typeof setTimeout;
  addEventListener: (type: string, listener: () => void) => void;
};

export type BookClickInput = {
  title: string;
  id?: string;
  isbn?: string;
  asin?: string | null;
  amazonUrl?: string;
};

export type ResourceClickInput = {
  name: string;
  domain: string;
  category: string;
  subcategory?: string;
  url?: string;
};

export function buildResourceClickParams(resource: ResourceClickInput): Record<string, unknown>;
export function trackResourceClick(resource: ResourceClickInput, win?: AnalyticsWindow): void;
export function extractAsinFromUrl(amazonUrl?: string | null): string | undefined;
export function buildBookClickParams(book: BookClickInput): Record<string, unknown>;
export function ensureGtagStub(win?: AnalyticsWindow): void;
export function initGoogleAnalytics(win?: AnalyticsWindow): void;
export function injectGtagScript(win?: AnalyticsWindow): void;
export function scheduleGtagScriptLoad(win?: AnalyticsWindow): void;
export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
  win?: AnalyticsWindow,
): void;
export function trackBookClick(book: BookClickInput, win?: AnalyticsWindow): void;
export function initWebVitals(win?: AnalyticsWindow): void;
export function initVisibilityTracking(win?: AnalyticsWindow): void;
