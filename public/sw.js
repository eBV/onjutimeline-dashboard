/* Ohnahji timeline service worker.
 * Purpose: satisfy browser installability (a registered worker with a
 * fetch handler) and give the installed app a reliable offline shell.
 * Safety rules, in order:
 *  - API and third-party data (our /api/*, chain RPC, Highlight, fonts)
 *    are NEVER cached: every such request goes to the network, and on
 *    failure it fails like there was no worker. Live data is never
 *    served stale as if fresh.
 *  - Same-origin /assets/* files are content-hashed by Vite, so they
 *    are immutable and safe to cache-first.
 *  - Navigations are network-first with a fallback to the cached app
 *    shell, so the installed app still opens offline.
 * A new version does NOT skipWaiting: it activates on the next load,
 * never mid-session.
 */
const CACHE_NAME = 'ohnahji-shell-v1'
const SHELL_URLS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isApiOrThirdParty(url) {
  if (url.pathname.startsWith('/api/')) return true
  return url.origin !== self.location.origin
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Live data: straight to the network, never cached, never stale.
  if (isApiOrThirdParty(url)) return

  // Navigations: network first, cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html')),
    )
    return
  }

  // Immutable hashed build assets: cache first, network fills the cache.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            return response
          }),
      ),
    )
    return
  }

  // Everything else same-origin (icons, manifest): network first,
  // cached copy as the offline fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        return response
      })
      .catch(() => caches.match(request)),
  )
})
