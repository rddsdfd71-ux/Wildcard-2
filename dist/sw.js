const CACHE_VERSION = 'wild-card-v5.0.0';
const STATIC_CACHE = 'wild-card-static-v5.0.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install — cache only the essential static shell, skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(err => console.log('SW install cache error:', err))
  );
  self.skipWaiting();
});

// Activate — DELETE ALL caches unconditionally so stale JS never persists
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames.map(name => {
          console.log('SW: Deleting cache', name);
          return caches.delete(name);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — JS/CSS/Vite assets always go to network (never serve stale code)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Navigation: network first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put('/index.html', clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // API requests: always network, never cache
  if (url.pathname.startsWith('/api')) {
    event.respondWith(fetch(request));
    return;
  }

  // JS, CSS, and Vite chunk assets: ALWAYS network — never cache
  // This prevents stale JS bundles from being served after updates
  if (
    url.pathname.match(/\.(js|css|mjs)$/) ||
    url.pathname.includes('/@') ||
    url.pathname.includes('/assets/') ||
    url.pathname.includes('node_modules') ||
    url.pathname.includes('?v=') ||
    url.pathname.includes('?t=')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Images, fonts, icons: cache-first
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time for your workout!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
  };
  event.waitUntil(
    self.registration.showNotification('Wild Card Training', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
