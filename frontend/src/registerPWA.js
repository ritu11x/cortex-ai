// frontend/src/registerPWA.js

export function registerPWA() {
  if (!('serviceWorker' in navigator)) return

  // Register SW
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.log('✅ Cortex PWA registered:', reg.scope)
    } catch (err) {
      console.warn('PWA registration failed:', err)
    }
  })

  // ✅ Listen for shared content from service worker (when dashboard is already open)
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'SHARE_TARGET') {
      const content = {
        url:   e.data.url   || '',
        title: e.data.title || '',
        content: e.data.text || '',
      }
      // Store it
      sessionStorage.setItem('sharedContent', JSON.stringify(content))
      // Fire custom event — Dashboard listens for this
      window.dispatchEvent(new CustomEvent('cortex:share', { detail: content }))
    }
  })
}
