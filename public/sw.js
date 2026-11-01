// Service Worker for YouTube Alert PWA
const CACHE_NAME = 'yt-alert-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push notification events
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'YouTube Alert';
    const options = {
      body: data.body || 'New video match found',
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      tag: data.tag || 'yt-alert',
      renotify: true,
      data: {
        url: data.url || 'https://www.youtube.com'
      }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Push error:', e);
  }
});

// Handle notification click to open video
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || 'https://www.youtube.com';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
