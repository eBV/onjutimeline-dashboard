// Registers the app-shell service worker in production builds only.
// Failures are silent by design: the site works exactly the same
// without a worker, it just is not installable. A new worker version
// activates on the next load (the worker does not skipWaiting), so an
// update can never interrupt a live session.
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silent: no user-facing error, no retry loop.
    })
  })
}
