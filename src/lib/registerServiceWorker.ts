// Registers the app-shell service worker in production builds only.
// Registration happens immediately, NOT on the window load event: load
// waits for every eager subresource (fonts, embeds, above-fold images),
// so a load-deferred registration left fresh tabs uninstallable until
// the whole page finished loading, and never installable at all if one
// subresource hung. Registering at once makes the tab installable
// within about a second of navigation. Failures are silent by design:
// the site works exactly the same without a worker, it just is not
// installable. A new worker version activates on the next load (the
// worker does not skipWaiting), so an update can never interrupt a
// live session.
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // Silent: no user-facing error, no retry loop.
  })
}
