// This is a service worker file that will handle notifications
// when the app is not in focus

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  // Get the notification data
  const data = event.notification.data

  // If there's a URL in the data, open it
  if (data && data.url) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === data.url && "focus" in client) {
            return client.focus()
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(data.url)
        }
      }),
    )
  }
})

// Handle push notifications (for future use with web push)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()

    const options = {
      body: data.body || "New notification",
      icon: data.icon || "/favicon.ico",
      badge: data.badge || "/favicon.ico",
      data: data.data || {},
      requireInteraction: data.requireInteraction || false,
    }

    event.waitUntil(self.registration.showNotification(data.title || "WatchTracker", options))
  }
})
