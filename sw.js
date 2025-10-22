// sw.js - Enhanced Service Worker for CephasGM ERP

const CACHE_NAME = 'cephasgm-erp-v4';
const API_CACHE_NAME = 'cephasgm-api-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './pwa-init.js',
  
  // Core module pages
  './admin.html',
  './attendance.html',
  './community.html',
  './customer-service.html',
  './finance.html',
  './hr.html',
  './inventory.html',
  './legal.html',
  './marketing.html',
  './meetings.html',
  './payroll.html',
  './procurement.html',
  './projects.html',
  './safety.html',
  './sales.html',
  './training.html',
  './transport.html'
];

// Install event - cache all essential resources
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Opened cache, adding resources...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ All resources cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated and old caches cleaned');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement various caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle HTML pages with network-first strategy
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(handleHtmlRequest(request));
    return;
  }
  
  // Handle static assets with cache-first strategy
  if (request.url.includes('/static/') || 
      request.url.includes('.css') || 
      request.url.includes('.js') ||
      request.url.includes('.png') ||
      request.url.includes('.jpg') ||
      request.url.includes('.json')) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Default: network-first strategy for other resources
  event.respondWith(handleDefaultRequest(request));
});

// API Request Handler - Network First
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the successful response
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API
    return new Response(
      JSON.stringify({ 
        error: 'You are offline and no cached data is available',
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// HTML Request Handler - Network First
async function handleHtmlRequest(request) {
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('./index.html');
  }
}

// Static Asset Handler - Cache First
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Background update cache
    updateCache(request);
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Default Request Handler - Network First
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Generic offline response
    return new Response('You are offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Background cache update
async function updateCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silently fail - we have cached version
  }
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // This would sync any pending operations when connection is restored
  console.log('🔄 Performing background sync...');
}

// Push Notification Handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from CephasGM ERP',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: data.tag || 'erp-notification',
    data: data.url || './',
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'CephasGM ERP', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data);
        }
      })
    );
  }
});

// Periodic Sync for background updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-update') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  // Update cached content periodically
  console.log('🔄 Periodic content update check');
  
  const cache = await caches.open(CACHE_NAME);
  const requests = urlsToCache.map(url => new Request(url));
  
  for (const request of requests) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse);
      }
    } catch (error) {
      // Silently continue with other requests
    }
  }
}

console.log('🚀 CephasGM ERP Service Worker Loaded');
