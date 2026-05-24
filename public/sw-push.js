/**
 * LifeOS Service Worker
 *
 * Handles:
 * - Push notification events (morning reminder + night check-in)
 * - Notification click routing
 * - Offline fallback (managed by next-pwa workbox)
 */

/* eslint-disable no-restricted-globals */

/** @param {PushEvent} event */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'LifeOS', body: event.data.text() };
  }

  const { title, body, url = '/dashboard', icon = '/icons/icon-192x192.png', badge = '/icons/icon-96x96.png', tag = 'lifeos-notification' } = payload;

  const options = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    requireInteraction: false,
    data: { url },
    actions: tag === 'morning-reminder'
      ? [{ action: 'generate', title: '🗓 Generate My Day', icon: '/icons/icon-96x96.png' }]
      : [{ action: 'checkin', title: '✅ Start Check-In', icon: '/icons/icon-96x96.png' }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/** @param {NotificationEvent} event */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If app is already open, focus it and navigate
        for (const client of windowClients) {
          if ('navigate' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Otherwise open a new window
        return clients.openWindow(url);
      })
  );
});
