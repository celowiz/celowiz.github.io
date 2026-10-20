import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOK_CLICK_EVENT,
  RESOURCE_CLICK_EVENT,
  buildResourceClickParams,
  trackResourceClick,
  GA_MEASUREMENT_ID,
  buildBookClickParams,
  ensureGtagStub,
  injectGtagScript,
  scheduleGtagScriptLoad,
  trackBookClick,
  trackEvent,
  initWebVitals,
  initVisibilityTracking,
} from './analytics.mjs';

function createFakeWindow({ readyState = 'loading', search = '', idle = true } = {}) {
  const scripts = [];
  const timeouts = [];
  const idleCallbacks = [];
  const listeners = {};

  const win = {
    dataLayer: undefined,
    gtag: undefined,
    __gaConfigQueued: undefined,
    location: { search },
    requestIdleCallback: idle
      ? (cb, opts) => {
          idleCallbacks.push({ cb, opts });
          return idleCallbacks.length;
        }
      : undefined,
    setTimeout: (cb, ms) => {
      timeouts.push({ cb, ms });
      return timeouts.length;
    },
    addEventListener: (type, cb) => {
      (listeners[type] ||= []).push(cb);
    },
    document: {
      readyState,
      getElementById: (id) => scripts.find((s) => s.id === id) ?? null,
      createElement: (tag) => ({
        tagName: tag,
        id: '',
        async: false,
        src: '',
      }),
      head: {
        appendChild: (el) => {
          scripts.push(el);
        },
      },
    },
    scripts,
    timeouts,
    idleCallbacks,
    listeners,
  };

  return win;
}

function layer(win) {
  return (win.dataLayer || []).map((item) => Array.from(item));
}

function eventsNamed(win, name) {
  return layer(win)
    .filter((row) => row[0] === 'event' && row[1] === name)
    .map((row) => row[2] ?? {});
}

const sampleBook = {
  id: '9780470411148',
  isbn: '9780470411148',
  title: 'Quantitative Trading',
  amazonUrl: 'https://www.amazon.com.br/foo/dp/1119800064/?tag=celowiz05-20',
};

describe('buildBookClickParams', () => {
  it('uses a single click_book payload with GA4 book params and beacon transport', () => {
    const params = buildBookClickParams(sampleBook);
    assert.equal(params.book_title, 'Quantitative Trading');
    assert.equal(params.book_isbn, '9780470411148');
    assert.equal(params.book_asin, '1119800064');
    assert.equal(params.event_label, 'Quantitative Trading');
    assert.equal(params.event_category, 'Bookshelf');
    assert.equal(params.transport_type, 'beacon');
  });

  it('falls back to id for isbn and extracts ASIN from /gp/product/ when asin is missing', () => {
    const params = buildBookClickParams({
      id: '9798632784986',
      title: 'Algorithmic Trading with Python',
      amazonUrl: 'https://www.amazon.com.br/gp/product/B086Y6H6YG/?tag=celowiz05-20',
    });
    assert.equal(params.book_isbn, '9798632784986');
    assert.equal(params.book_asin, 'B086Y6H6YG');
  });
});

describe('gtag stub queue', () => {
  let win;

  beforeEach(() => {
    win = createFakeWindow();
  });

  it('queues click_book when the gtag.js script has not loaded yet', () => {
    trackBookClick(sampleBook, win);

    assert.equal(typeof win.gtag, 'function');
    assert.equal(win.scripts.length, 1);
    assert.match(win.scripts[0].src, /gtag\/js\?id=G-QCBFGR39WG/);

    const clicks = eventsNamed(win, BOOK_CLICK_EVENT);
    assert.equal(clicks.length, 1);
    assert.equal(clicks[0].book_title, 'Quantitative Trading');
    assert.equal(clicks[0].book_isbn, '9780470411148');
    assert.equal(clicks[0].book_asin, '1119800064');
    assert.equal(clicks[0].event_label, 'Quantitative Trading');
    assert.equal(clicks[0].transport_type, 'beacon');
    assert.equal(clicks[0].send_to, GA_MEASUREMENT_ID);
  });

  it('uses one event name for every book and breaks down by book_title', () => {
    trackBookClick(sampleBook, win);
    trackBookClick(
      {
        title: 'Trading Evolved',
        isbn: '9781091983786',
        amazonUrl: 'https://www.amazon.com.br/foo/dp/109198378X/',
      },
      win,
    );

    const clicks = eventsNamed(win, BOOK_CLICK_EVENT);
    assert.equal(clicks.length, 2);
    assert.equal(clicks[0].book_title, 'Quantitative Trading');
    assert.equal(clicks[1].book_title, 'Trading Evolved');
    assert.equal(
      layer(win).filter((row) => row[0] === 'event').every((row) => row[1] === BOOK_CLICK_EVENT),
      true,
    );
    assert.equal(BOOK_CLICK_EVENT, 'click_book');
  });

  it('does not drop an event when window.gtag was previously undefined', () => {
    assert.equal(win.gtag, undefined);
    trackEvent('language_change', { event_label: 'en' }, win);
    const hits = eventsNamed(win, 'language_change');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].event_label, 'en');
    assert.equal(hits[0].send_to, GA_MEASUREMENT_ID);
    assert.equal(win.scripts.length, 0);
  });
});

describe('click_resource', () => {
  const resource = {
    name: 'QuantEcon: Python para Economia',
    domain: 'quantecon.org',
    category: 'learning-materials',
    subcategory: 'learning-materials/economics',
    url: 'https://quantecon.org/',
  };

  it('builds name, domain and category params', () => {
    const params = buildResourceClickParams(resource);
    assert.equal(params.resource_name, resource.name);
    assert.equal(params.resource_domain, 'quantecon.org');
    assert.equal(params.resource_category, 'learning-materials');
    assert.equal(params.resource_subcategory, 'learning-materials/economics');
    assert.equal(params.event_category, 'SecondBrain');
    assert.equal(params.transport_type, 'beacon');
  });

  it('queues one click_resource event with beacon transport', () => {
    const win = createFakeWindow();
    trackResourceClick(resource, win);
    const events = eventsNamed(win, RESOURCE_CLICK_EVENT);
    assert.equal(RESOURCE_CLICK_EVENT, 'click_resource');
    assert.equal(events.length, 1);
    assert.equal(events[0].resource_domain, 'quantecon.org');
    assert.equal(events[0].send_to, GA_MEASUREMENT_ID);
  });
});

describe('scheduleGtagScriptLoad', () => {
  it('installs the gtag stub and config immediately, and only injects the script after load + idle', () => {
    const win = createFakeWindow({ readyState: 'loading' });
    scheduleGtagScriptLoad(win);

    assert.equal(typeof win.gtag, 'function');
    const commands = layer(win);
    assert.equal(commands[0][0], 'js');
    assert.equal(commands[1][0], 'config');
    assert.equal(commands[1][1], GA_MEASUREMENT_ID);
    assert.equal(win.scripts.length, 0);
    assert.equal(win.idleCallbacks.length, 0);

    for (const cb of win.listeners.load || []) cb();
    assert.equal(win.scripts.length, 0);
    assert.equal(win.idleCallbacks.length, 1);
    assert.equal(win.idleCallbacks[0].opts?.timeout, 3000);

    win.idleCallbacks[0].cb();
    assert.equal(win.scripts.length, 1);
    assert.match(win.scripts[0].src, /googletagmanager\.com\/gtag\/js\?id=G-QCBFGR39WG/);
    assert.equal(win.scripts[0].async, true);
  });

  it('falls back to setTimeout when requestIdleCallback is missing', () => {
    const win = createFakeWindow({ readyState: 'complete', idle: false });
    scheduleGtagScriptLoad(win);
    assert.equal(win.scripts.length, 0);
    assert.equal(win.timeouts.length, 1);
    win.timeouts[0].cb();
    assert.equal(win.scripts.length, 1);
  });

  it('enables debug_mode on config when ?ga_debug=1 is present', () => {
    const win = createFakeWindow({ search: '?ga_debug=1', readyState: 'complete', idle: false });
    scheduleGtagScriptLoad(win);
    const config = layer(win).find((row) => row[0] === 'config');
    assert.equal(config[2]?.debug_mode, true);
    assert.equal(config[2]?.content_group, 'portfolio');
  });
});

describe('injectGtagScript', () => {
  it('injects the measurement snippet only once', () => {
    const win = createFakeWindow();
    ensureGtagStub(win);
    injectGtagScript(win);
    injectGtagScript(win);
    assert.equal(win.scripts.length, 1);
  });
});

describe('initWebVitals', () => {
  function vitalsWindow() {
    const observers = [];
    const winL = {};
    const docL = {};
    class FakePO {
      constructor(cb) { this.cb = cb; observers.push(this); }
      observe(opts) { this.type = opts.type; }
      disconnect() { this.off = true; }
    }
    const document = {
      hidden: false,
      visibilityState: 'visible',
      addEventListener: (t, cb) => { (docL[t] ||= []).push(cb); },
    };
    const win = {
      dataLayer: [],
      PerformanceObserver: FakePO,
      document,
      addEventListener: (t, cb) => { (winL[t] ||= []).push(cb); },
    };
    const emit = (type, entries) => observers
      .filter((o) => o.type === type && !o.off)
      .forEach((o) => o.cb({ getEntries: () => entries }));
    const fire = (t) => (winL[t] || []).forEach((cb) => cb());
    const hide = () => {
      document.hidden = true;
      document.visibilityState = 'hidden';
      (docL.visibilitychange || []).forEach((cb) => cb());
    };
    const metrics = () => win.dataLayer
      .map((r) => Array.from(r))
      .filter((r) => r[0] === 'event' && r[1] === 'performance_metric')
      .map((r) => [r[2].event_label, r[2].value]);
    return { win, observers, emit, fire, hide, metrics };
  }

  it('registra os observers uma única vez mesmo com várias chamadas (StrictMode / vários hooks)', () => {
    const v = vitalsWindow();
    initWebVitals(v.win);
    initWebVitals(v.win);
    initWebVitals(v.win);
    assert.equal(v.observers.length, 3);
  });

  it('envia LCP, FID e CLS uma vez cada', () => {
    const v = vitalsWindow();
    initWebVitals(v.win);
    initWebVitals(v.win);
    v.emit('largest-contentful-paint', [{ startTime: 100 }]);
    v.emit('largest-contentful-paint', [{ startTime: 256.4 }]);
    v.emit('first-input', [{ startTime: 10, processingStart: 12 }]);
    v.emit('first-input', [{ startTime: 20, processingStart: 30 }]);
    v.emit('layout-shift', [{ value: 0.05, hadRecentInput: false }, { value: 0.5, hadRecentInput: true }]);
    v.fire('pointerdown');
    v.fire('keydown');
    v.hide();
    v.hide();
    assert.deepEqual(v.metrics(), [['FID', 2], ['LCP', 256], ['CLS', 50]]);
  });

  it('page_hidden registrado uma única vez', () => {
    const v = vitalsWindow();
    initVisibilityTracking(v.win);
    initVisibilityTracking(v.win);
    v.hide();
    const hidden = v.win.dataLayer.map((r) => Array.from(r)).filter((r) => r[1] === 'page_hidden');
    assert.equal(hidden.length, 1);
  });
});
