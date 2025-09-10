// Service Worker para cache offline básico
const CACHE_NAME = 'mw-portfolio-v1';
const STATIC_CACHE = 'mw-portfolio-static-v1';
const DYNAMIC_CACHE = 'mw-portfolio-dynamic-v1';

// Recursos para cache imediato
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/favicon.svg',
  '/books.csv'
];

// Recursos externos importantes para cache
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');

  event.waitUntil(
    Promise.all([
      // Cache de assets estáticos
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache de assets externos
      caches.open('external-cache').then(cache => {
        console.log('Service Worker: Cacheando assets externos');
        return cache.addAll(EXTERNAL_ASSETS);
      })
    ]).then(() => {
      console.log('Service Worker: Instalação completa');
      return self.skipWaiting();
    })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');

  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== 'external-cache') {
              console.log('Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Tomar controle imediatamente
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Ativação completa');
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia Cache First para assets estáticos
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/images/')) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          return caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Estratégia Network First para conteúdo dinâmico
  if (request.destination === 'document' || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then(response => {
            return response || caches.match('/');
          });
        })
    );
    return;
  }

  // Estratégia Stale While Revalidate para outros recursos
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Limpar cache periodicamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Service Worker: Cache limpo');
    });
  }
});
