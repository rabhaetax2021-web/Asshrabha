self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Basic fetch handler: fallback to network, then cache (no complex caching strategy)
self.addEventListener('fetch', (event) => {
  const req = event.request
  // Forward non-GET requests (POST/PUT/DELETE) directly to network.
  // This prevents the service worker from returning cached responses for API calls.
  if (req.method !== 'GET') {
    event.respondWith(fetch(req).catch(() => new Response(null, { status: 503 })))
    return
  }

  event.respondWith(fetch(req).catch(() => caches.match(req)))
});
