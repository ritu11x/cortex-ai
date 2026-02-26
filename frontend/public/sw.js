// Cortex Service Worker — PWA + Mobile Share Target
const CACHE = 'cortex-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

// ✅ Handle share from mobile apps (YouTube, Instagram, Chrome etc.)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  if (url.pathname === '/save') {
    e.respondWith((async () => {
      // Get shared params
      const sharedUrl   = url.searchParams.get('url')   || ''
      const sharedTitle = url.searchParams.get('title') || ''
      const sharedText  = url.searchParams.get('text')  || ''

      // Try to pass to existing open dashboard window
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })

      for (const client of allClients) {
        if (client.url.includes('/dashboard')) {
          client.postMessage({
            type: 'SHARE_TARGET',
            url:   sharedUrl || sharedText,
            title: sharedTitle,
            text:  sharedText,
          })
          await client.focus()
          return Response.redirect('/dashboard?openSave=true', 302)
        }
      }

      // No dashboard open — go to /save route which handles the redirect
      const redirectUrl = `/save?url=${encodeURIComponent(sharedUrl)}&title=${encodeURIComponent(sharedTitle)}&text=${encodeURIComponent(sharedText)}`
      return Response.redirect(redirectUrl, 302)
    })())
    return
  }

  // Default: network first, cache fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})
