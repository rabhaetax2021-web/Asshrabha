self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('asshrabha-shell').then((cache) =>
      cache.addAll([
        '/',
        '/login',
        '/manifest.webmanifest',
        '/vercel.svg',
      ]).catch(() => undefined)
    )
  )
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') {
    event.respondWith(fetch(req).catch(() => new Response(null, { status: 503 })))
    return
  }

  const isNavigationRequest = req.mode === 'navigate' || req.destination === 'document'
  if (isNavigationRequest) {
    // Let browser navigations go directly to the network so route changes do not
    // get stuck behind stale cached HTML in Chrome/Samsung Internet.
    event.respondWith(fetch(req))
    return
  }

  event.respondWith(
    fetch(req)
      .then((response) => {
        const cloned = response.clone()
        // Avoid caching navigation documents at runtime, especially admin pages,
        // so stale login/html responses don't persist after approval reloads.
        if (req.destination === 'script' || req.destination === 'style' || req.destination === 'image') {
          caches.open('asshrabha-shell').then((cache) => cache.put(req, cloned)).catch(() => undefined)
        }
        return response
      })
      .catch(() => caches.match(req).then((cached) => cached || new Response(null, { status: 503 })))
  )
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Asshrabha', body: 'You have a new notification.', data: { url: '/' } }
  try {
    if (event.data) {
      payload = event.data.json()
    }
  } catch (e) {
    // malformed payload
  }

  const options = {
    body: payload.body,
    icon: '/vercel.svg',
    badge: '/vercel.svg',
    data: payload.data || {},
    vibrate: [100, 50, 100],
    tag: payload.data?.tag || 'asshrabha-push',
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(targetUrl))
});
