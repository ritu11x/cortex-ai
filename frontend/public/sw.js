// Cortex Service Worker — enables PWA + Share Target
const CACHE = 'cortex-v1'

// Install
self.addEventListener('install', e => {
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
})

// ✅ Handle share from other apps (Instagram, YouTube, Chrome etc.)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // When user shares TO Cortex from another app
  if (url.pathname === '/save' && e.request.method === 'GET') {
    const sharedUrl   = url.searchParams.get('url')   || ''
    const sharedTitle = url.searchParams.get('title') || ''
    const sharedText  = url.searchParams.get('text')  || ''

    // Store shared content then redirect to dashboard
    e.respondWith((async () => {
      const allClients = await clients.matchAll({ type: 'window' })

      // If dashboard already open — send message to it
      for (const client of allClients) {
        if (client.url.includes('/dashboard')) {
          client.postMessage({
            type: 'SHARE_TARGET',
            url: sharedUrl || sharedText,
            title: sharedTitle,
          })
          client.focus()
          return Response.redirect('/dashboard?openSave=true', 302)
        }
      }

      // Otherwise redirect to dashboard with params
      const redirectUrl = `/dashboard?openSave=true&sharedUrl=${encodeURIComponent(sharedUrl || sharedText)}&sharedTitle=${encodeURIComponent(sharedTitle)}`
      return Response.redirect(redirectUrl, 302)
    })())
    return
  }

  // Default: network first
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
})
