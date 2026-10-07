export const GA_MEASUREMENT_ID = 'G-QCBFGR39WG';
export const BOOK_CLICK_EVENT = 'click_book';

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
  const config = {};
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
}

export function trackBookClick(book, win = defaultWindow()) {
  trackEvent(BOOK_CLICK_EVENT, buildBookClickParams(book), win);
}
