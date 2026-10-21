// Service worker do portfólio (celowiz.github.io).
//
// O registro fica em /sw.js com scope "/", o que no GitHub Pages cobre também os outros
// repositórios publicados no mesmo host (/monitor-b3/, /rrg/, /hmm-regimes/...). Por isso o SW
// trabalha com ALLOWLIST: só intercepta caminhos que são do portfólio. Qualquer outro caminho
// passa direto para a rede (o SW nem chama respondWith), então os dados dos subprojetos nunca
// saem do cache daqui.
const CACHE_VERSION = 'v5';
const CACHE_PREFIX = 'mw-portfolio-';
const STATIC_CACHE = `${CACHE_PREFIX}static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}dynamic-${CACHE_VERSION}`;
const MAX_DYNAMIC_ENTRIES = 40; // HTML + JSON do portfólio
const MAX_STATIC_ENTRIES = 150; // bundles com hash, imagens, capas, ícones, fonte

const PRECACHE = [
  '/manifest.json',
  '/favicon.ico',
  '/images/favicon.svg',
  '/images/favicon-32.png',
  '/images/apple-touch-icon.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
];

// Páginas (navegação) do portfólio.
const PAGE_PATHS = new Set(['/', '/index.html', '/second-brain', '/second-brain/', '/second-brain/index.html']);
['/lab', '/lab/', '/lab/index.html'].forEach((p) => PAGE_PATHS.add(p));
// Dados do portfólio gerados no build (mudam todo dia): rede primeiro.
const DATA_PATHS = new Set(['/books.json', '/second-brain.json']);
// Arquivos soltos da raiz.
const ROOT_FILES = new Set(['/manifest.json', '/favicon.ico', '/placeholder-book.jpg']);
// Pastas de assets do portfólio. /assets/ tem nome com hash (imutável).
const HASHED_PREFIX = '/assets/';
const ASSET_PREFIXES = ['/images/', '/icons/', '/fonts/', '/covers/'];

/**
 * Decide a estratégia para um caminho do mesmo host. Retorna null para "não interceptar".
 * Exposto em self.__swRoute para os testes.
 */
function route(pathname, isNavigation) {
  if (PAGE_PATHS.has(pathname)) return 'page';
  if (isNavigation) return null; // navegação para fora do portfólio: rede pura
  if (DATA_PATHS.has(pathname)) return 'data';
  if (pathname.startsWith(HASHED_PREFIX)) return 'immutable';
  if (ROOT_FILES.has(pathname) || ASSET_PREFIXES.some((p) => pathname.startsWith(p))) return 'asset';
  return null;
}
self.__swRoute = route;

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  // cache.keys() vem em ordem de inserção: remove as mais antigas.
  for (let i = 0; i < keys.length - max; i += 1) {
    await cache.delete(keys[i]);
  }
}

async function put(name, max, request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  const cache = await caches.open(name);
  await cache.delete(request); // reinserir: a entrada vai para o fim (mais recente)
  await cache.put(request, response);
  await trimCache(name, max);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined) // precache é opcional; não bloqueia a atualização do SW
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            // Apaga todo cache antigo do portfólio (v4 e anteriores, que guardavam dados dos
            // subprojetos) e qualquer cache que não seja o atual.
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

function networkFirst(event, request) {
  return fetch(request)
    .then((response) => {
      event.waitUntil(put(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES, request, response.clone()));
      return response;
    })
    .catch(() =>
      caches.match(request).then((cached) => {
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('/');
        return Response.error();
      })
    );
}

function cacheFirst(event, request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      event.waitUntil(put(STATIC_CACHE, MAX_STATIC_ENTRIES, request, response.clone()));
      return response;
    });
  });
}

function staleWhileRevalidate(event, request) {
  return caches.match(request).then((cached) => {
    const network = fetch(request)
      .then((response) => {
        event.waitUntil(put(STATIC_CACHE, MAX_STATIC_ENTRIES, request, response.clone()));
        return response;
      })
      .catch(() => cached || Response.error());
    if (cached) {
      event.waitUntil(network.catch(() => undefined));
      return cached;
    }
    return network;
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === 'navigate';
  const strategy = route(url.pathname, isNavigation);
  if (!strategy) return; // fora do portfólio (subprojetos e outros repos do Pages): rede

  if (strategy === 'page' || strategy === 'data') {
    event.respondWith(networkFirst(event, request));
  } else if (strategy === 'immutable') {
    event.respondWith(cacheFirst(event, request));
  } else {
    event.respondWith(staleWhileRevalidate(event, request));
  }
});
