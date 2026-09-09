// AQUASoft PWA Service Worker
const CACHE_NAME = 'aquasoft-pwa-v3.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './translations.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './images/in ob.png',
  './images/in white.png',
  './tools/feed.html',
  './tools/feed-formulation.html',
  './tools/oxygen.html',
  './tools/ammonia.html',
  './tools/disinfectans.html',
  './tools/water-corrector.html',
  './tools/water-parameter.html',
  './tools/log-book.html',
  './tools/course.html',
  './tools/library.html',
  './tools/coming-soon.html'
];

// Install: Cache all essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[AQUASoft SW] Caching app assets for offline use...');
      return cache.addAll(PRECACHE_ASSETS).catch(err => console.warn('Cache error:', err));
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[AQUASoft SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate with offline fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, return cached response if available
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
