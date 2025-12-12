// sw.js - production-ready Service Worker for CephasGM ERP
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `cephasgm-static-${CACHE_VERSION}`;
const API_CACHE = `cephasgm-api-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// IMPORTANT: list the files you want pre-cached. Keep these paths root-relative.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/pwa-init.js',
  '/offline.html',
  // module pages (cache them if they are safe to cache)
  '/admin.html',
  '/attendance.html',
  '/community.html',
  '/customer-service.html',
  '/finance.html',
  '/hr.html',
  '/inventory.html',
  '/legal.html',
  '/marketing.html',
  '/meeting.html',
  '/payroll.html',
  '/procurement.html',
  '/projects.html',
  '/safety.html',
  '/sales.html',
  '/training.html',
  '/transport.html'
];

self.addEventListener('install', (event) => {
  console.log('[sw] install');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[sw] activate');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Utility: try network then fallback to cache (NetworkFirst)
async function networkFirst(request, cacheName = STATIC_CACHE) {
  try {
    const response = await fetch(request);
    // optionally cache successful GET responses (non opaque)
    if (request.method === 'GET' && response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // final fallback
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE);
    }
    throw err;
  }
}

// Utility: cache-first (CacheFirst)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (request.method === 'GET' && response && response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // If not found and network fails, optionally return offline page for navigations
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE);
    }
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Serve navigations (SPA-style) with NetworkFirst
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE).catch(() => caches.match(OFFLINE_PAGE)));
    return;
  }

  // API requests (assume /api/ prefix) - NetworkFirst with API_CACHE
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE).catch(() => new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Static assets: CSS, JS, images - CacheFirst
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'image' || url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.json')) {
    event.respondWith(cacheFirst(request).catch(() => networkFirst(request)));
    return;
  }

  // Default: network first as fallback
  event.respondWith(networkFirst(request).catch(() => caches.match(request)));
});

// Listen for messages from pages (optional) to trigger skipWaiting/update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync placeholder (requires registration from client)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-ops') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // app-specific logic: read queued operations from IndexedDB and send to server
  // left as placeholder
  console.log('[sw] background sync placeholder');
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const title = data.title || 'CephasGM ERP';
  const options = {
    body: data.body || 'You have a new message',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
    actions: data.actions || []
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[sw] CephasGM ERP Service Worker registered');
