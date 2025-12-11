const CACHE_NAME = 'budget-wizard-v2';
const ASSETS = [
  '/',
  '/Index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => key !== CACHE_NAME && caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkResp) => {
        const copy = networkResp.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache GET requests and same-origin
          if (req.method === 'GET' && req.url.startsWith(self.location.origin)) {
            cache.put(req, copy);
          }
        });
        return networkResp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
