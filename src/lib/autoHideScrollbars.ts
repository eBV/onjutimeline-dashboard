// Auto-hiding scrollbars, sitewide. The CSS in index.css keeps the
// scrollbar width constant and transitions the thumb/track colors, so
// hiding never shifts layout; this module only toggles the `scrolling`
// class on <html>: present while the user scrolls, presses, or drags,
// removed after a short idle timeout so the bars dissolve out. Scroll
// events do not bubble, so the listener uses the capture phase to catch
// scrolls from any nested scroller (slide scrollers, gallery grid,
// modals) from one document-level subscription.
export const SCROLLBAR_IDLE_MS = 1000

export function initAutoHideScrollbars(
  doc: Document = document,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  const show = () => {
    doc.documentElement.classList.add('scrolling')
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      doc.documentElement.classList.remove('scrolling')
      timer = null
    }, SCROLLBAR_IDLE_MS)
  }
  const opts: AddEventListenerOptions = { capture: true, passive: true }
  doc.addEventListener('scroll', show, opts)
  doc.addEventListener('wheel', show, opts)
  doc.addEventListener('touchmove', show, opts)
  doc.addEventListener('pointerdown', show, opts)
  return () => {
    doc.removeEventListener('scroll', show, opts)
    doc.removeEventListener('wheel', show, opts)
    doc.removeEventListener('touchmove', show, opts)
    doc.removeEventListener('pointerdown', show, opts)
    if (timer !== null) clearTimeout(timer)
    doc.documentElement.classList.remove('scrolling')
  }
}
