/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
self.addEventListener('activate', () => self.clients.claim())

type PushPayload = {
  title: string
  body: string
  habitId?: string
  url?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let data: PushPayload = { title: 'Tracker', body: 'Você tem um hábito pendente hoje.' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    // payload não era JSON, mantém o default
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url ?? '/' },
      tag: data.habitId ?? 'tracker-reminder',
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
