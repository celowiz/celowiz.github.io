export const GA_MEASUREMENT_ID = 'G-QCBFGR39WG';
export const BOOK_CLICK_EVENT = 'click_book';
export const RESOURCE_CLICK_EVENT = 'click_resource';

const ASIN_RE = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i;
const GTAG_SCRIPT_ID = 'ga-gtag';

function defaultWindow() {
  return typeof globalThis !== 'undefined' ? globalThis : undefined;
}

function isGaDebug(win) {
  const search = win?.location?.search;
  if (!search) return false;
  try {
    const query = String(search).startsWith('?') ? String(search).slice(1) : String(search);
    return new URLSearchParams(query).has('ga_debug');
  } catch {
    return false;
  }
}

export function extractAsinFromUrl(amazonUrl) {
  if (!amazonUrl) return undefined;
  const match = String(amazonUrl).match(ASIN_RE);
  return match ? match[1] : undefined;
}

export function buildBookClickParams(book) {
  const title = book?.title ?? '';
  const isbn = book?.isbn || book?.id;
  const asin = book?.asin || extractAsinFromUrl(book?.amazonUrl);
  const params = {
    book_title: title,
    event_label: title,
    event_category: 'Bookshelf',
    transport_type: 'beacon',
  };
  if (isbn) params.book_isbn = isbn;
  if (asin) params.book_asin = asin;
  return params;
}

/** Parâmetros do clique em um link da página Second Brain (nome, domínio, categoria). */
export function buildResourceClickParams(resource) {
  const name = resource?.name ?? '';
  const params = {
    resource_name: name,
    resource_domain: resource?.domain ?? '',
    resource_category: resource?.category ?? '',
    event_label: name,
    event_category: 'SecondBrain',
    transport_type: 'beacon',
  };
  if (resource?.subcategory) params.resource_subcategory = resource.subcategory;
  if (resource?.url) params.link_url = resource.url;
  return params;
}

export function ensureGtagStub(win = defaultWindow()) {
  if (!win) return;
  if (!Array.isArray(win.dataLayer)) {
    win.dataLayer = [];
  }
  if (typeof win.gtag === 'function') return;
  win.gtag = function gtag() {
    win.dataLayer.push(arguments);
  };
}

export function initGoogleAnalytics(win = defaultWindow()) {
  if (!win) return;
  ensureGtagStub(win);
  const alreadyConfigured = (win.dataLayer || []).some((item) => {
    try {
      return Array.from(item)[0] === 'config';
    } catch {
      return false;
    }
  });
  if (alreadyConfigured) return;
  win.gtag('js', new Date());
  const config = { content_group: 'portfolio' };
  if (isGaDebug(win)) config.debug_mode = true;
  win.gtag('config', GA_MEASUREMENT_ID, config);
}

export function injectGtagScript(win = defaultWindow()) {
  const doc = win?.document;
  if (!doc?.createElement || !doc.head) return;
  if (typeof doc.getElementById === 'function' && doc.getElementById(GTAG_SCRIPT_ID)) return;
  const script = doc.createElement('script');
  script.id = GTAG_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  doc.head.appendChild(script);
}

export function scheduleGtagScriptLoad(win = defaultWindow()) {
  if (!win) return;
  initGoogleAnalytics(win);

  const start = () => injectGtagScript(win);
  const afterLoad = () => {
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(start, { timeout: 3000 });
    } else {
      win.setTimeout(start, 1);
    }
  };

  if (win.document?.readyState === 'complete') {
    afterLoad();
    return;
  }
  if (typeof win.addEventListener === 'function') {
    win.addEventListener('load', afterLoad);
    return;
  }
  afterLoad();
}

export function trackEvent(name, params = {}, win = defaultWindow()) {
  if (!win || !name) return;
  ensureGtagStub(win);
  const payload = { send_to: GA_MEASUREMENT_ID, ...params };
  if (isGaDebug(win) && payload.debug_mode == null) {
    payload.debug_mode = true;
  }
  win.gtag('event', name, payload);
  if (payload.transport_type === 'beacon') {
    injectGtagScript(win);
  }
}

export function trackBookClick(book, win = defaultWindow()) {
  trackEvent(BOOK_CLICK_EVENT, buildBookClickParams(book), win);
}

export function trackResourceClick(resource, win = defaultWindow()) {
  trackEvent(RESOURCE_CLICK_EVENT, buildResourceClickParams(resource), win);
}

function trackMetric(win, metric, value) {
  trackEvent('performance_metric', {
    event_category: 'technical',
    event_label: metric,
    value: Math.round(value),
  }, win);
}

/**
 * Registra os observers de Web Vitals uma única vez por página (o hook useAnalytics é usado
 * por vários componentes e o StrictMode monta efeitos duas vezes). Cada métrica sai uma vez:
 * FID na primeira interação; LCP com o valor final na primeira interação ou ao esconder a aba;
 * CLS acumulado ao esconder a aba.
 */
export function initWebVitals(win = defaultWindow()) {
  if (!win || win.__gaVitalsStarted || typeof win.PerformanceObserver !== 'function') return;
  win.__gaVitalsStarted = true;
  const PO = win.PerformanceObserver;
  const sent = new Set();
  const once = (metric, value) => {
    if (sent.has(metric) || value == null || Number.isNaN(value)) return;
    sent.add(metric);
    trackMetric(win, metric, value);
  };
  const observe = (type, cb) => {
    try {
      const o = new PO((list) => cb(list.getEntries()));
      o.observe({ type, buffered: true });
      return o;
    } catch {
      return null;
    }
  };

  let lcp;
  let cls = 0;
  const lcpObs = observe('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1];
    if (last) lcp = last.startTime;
  });
  observe('first-input', (entries) => {
    const e = entries[0];
    if (e) once('FID', e.processingStart - e.startTime);
  });
  observe('layout-shift', (entries) => {
    for (const e of entries) if (!e.hadRecentInput) cls += e.value;
  });

  const finalizeLcp = () => {
    if (lcp === undefined) return;
    lcpObs?.disconnect();
    once('LCP', lcp);
  };
  for (const t of ['keydown', 'pointerdown']) {
    win.addEventListener(t, finalizeLcp, { once: true, capture: true });
  }
  win.document?.addEventListener('visibilitychange', () => {
    if (win.document.visibilityState !== 'hidden') return;
    finalizeLcp();
    once('CLS', cls * 1000); // GA4 só aceita value inteiro: CLS × 1000
  });
}

/** page_hidden / page_visible registrados uma única vez por página. */
export function initVisibilityTracking(win = defaultWindow()) {
  if (!win?.document || win.__gaVisibilityStarted) return;
  win.__gaVisibilityStarted = true;
  win.document.addEventListener('visibilitychange', () => {
    trackEvent(win.document.hidden ? 'page_hidden' : 'page_visible', { event_category: 'engagement' }, win);
  });
}
