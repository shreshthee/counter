const CACHE_NAME = 'chant-counter-shell-v1';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Fetch: Cache-first, fallback to network, fallback to cache index for navigation
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // cache same-origin responses
        if (event.request.url.startsWith(self.location.origin)) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return resp;
      }).catch(() => {
        // If navigation, return cached index.html
        if (event.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
