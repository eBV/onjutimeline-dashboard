import { useRef, useEffect, useCallback, RefObject } from 'react'
import { useMotionValue, MotionValue } from 'framer-motion'

interface UseSlideScrollOptions {
  slidePaths: string[]
  currentSlide: number
  isGalleryOpen: boolean
  navigate: (path: string, options?: { replace: boolean }) => void
  // False on the large-desktop layout, where the vertical scroller
  // owns scrolling instead. The hook still runs (hooks cannot be
  // conditional) but all of its effects no-op, so its wheel, key, and
  // scroll-to behaviour can never fight the desktop page.
  enabled?: boolean
}

interface UseSlideScrollResult {
  containerRef: RefObject<HTMLDivElement>
  scrollProgress: MotionValue<number>
}

const SCROLL_COOLDOWN = 1000
// Safety ceiling only: the lock is normally released by handleScroll as soon
// as the container reaches its target. A fixed 600ms lock was too short for
// multi-slide smooth scrolls, so the scroll handler hijacked navigation
// mid-animation and deep links (e.g. /mint) never settled on their slide.
const PROGRAMMATIC_SCROLL_TIMEOUT = 4000

export function useSlideScroll({
  slidePaths,
  currentSlide,
  isGalleryOpen,
  navigate,
  enabled = true,
}: UseSlideScrollOptions): UseSlideScrollResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollProgress = useMotionValue(0)
  const lastScrollTime = useRef(0)
  const isProgrammaticScroll = useRef(false)
  const programmaticTargetRef = useRef<number | null>(null)
  const programmaticScrollTimeoutRef = useRef<number | null>(null)

  const unlockProgrammaticScroll = useCallback(() => {
    isProgrammaticScroll.current = false
    programmaticTargetRef.current = null
    if (programmaticScrollTimeoutRef.current !== null) {
      window.clearTimeout(programmaticScrollTimeoutRef.current)
      programmaticScrollTimeoutRef.current = null
    }
  }, [])

  const lockProgrammaticScroll = useCallback((targetLeft?: number, timeoutMs: number = PROGRAMMATIC_SCROLL_TIMEOUT) => {
    isProgrammaticScroll.current = true
    programmaticTargetRef.current = targetLeft ?? null
    if (programmaticScrollTimeoutRef.current !== null) {
      window.clearTimeout(programmaticScrollTimeoutRef.current)
    }
    programmaticScrollTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScroll.current = false
      programmaticTargetRef.current = null
      programmaticScrollTimeoutRef.current = null
    }, timeoutMs)
  }, [])

  const navigateToSlide = useCallback((index: number) => {
    if (!slidePaths[index] || index === currentSlide) return
    lockProgrammaticScroll()
    navigate(slidePaths[index])
  }, [currentSlide, lockProgrammaticScroll, navigate, slidePaths])

  // Re-derive scrollProgress from the scroller's real geometry. This is
  // the same formula the scroll handler uses; it also runs outside scroll
  // events (see the deck-change effect below) because a MotionValue only
  // updates when told, and the deck can change shape without any scroll.
  const syncProgressFromGeometry = useCallback(() => {
    if (!containerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
    scrollProgress.set(scrollWidth - clientWidth > 0 ? scrollLeft / (scrollWidth - clientWidth) : 0)
  }, [scrollProgress])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollLeft, clientWidth } = containerRef.current
    syncProgressFromGeometry()

    if (isProgrammaticScroll.current) {
      // Release the lock once the smooth scroll lands on its target slide.
      const target = programmaticTargetRef.current
      if (target !== null && Math.abs(scrollLeft - target) < 10) {
        unlockProgrammaticScroll()
      }
      return
    }

    if (clientWidth > 0) {
      const newSlideIndex = Math.round(scrollLeft / clientWidth)
      if (newSlideIndex !== currentSlide && slidePaths[newSlideIndex]) {
        navigate(slidePaths[newSlideIndex], { replace: true })
      }
    }
  }, [currentSlide, navigate, slidePaths, syncProgressFromGeometry, unlockProgrammaticScroll])

  // Deck-change correction for the chrome tint (Part 5). When the deck
  // grows or shrinks (a wallet connecting proves or loses holder state),
  // the tint transform's stops remap, but a parked scroller fires no
  // scroll event, so scrollProgress keeps its old fraction and the shell
  // would sit on the wrong colour (parked on Art, 5/9, the remapped
  // stops put that fraction inside Merch's white). Re-derive progress
  // from the real geometry once the new slides have laid out, and when
  // parked exactly on the active slide, snap to its exact stop so the
  // tint is bit-exact. Mid-swipe blending is untouched: while a swipe or
  // a programmatic scroll is in flight this does nothing, and an idle
  // geometry re-derivation equals the value the next scroll event would
  // compute anyway.
  useEffect(() => {
    if (!enabled) return
    const correct = () => {
      if (isProgrammaticScroll.current || !containerRef.current) return
      syncProgressFromGeometry()
      const { scrollLeft, clientWidth } = containerRef.current
      const n = slidePaths.length
      if (clientWidth > 0 && n > 1 && Math.abs(scrollLeft - currentSlide * clientWidth) < 2) {
        scrollProgress.set(currentSlide / (n - 1))
      }
    }
    const raf = requestAnimationFrame(correct)
    const retry = window.setTimeout(correct, 300)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(retry)
    }
  }, [slidePaths, currentSlide, scrollProgress, syncProgressFromGeometry, enabled])

  const scrollToSlide = useCallback((index: number) => {
    if (!containerRef.current) return
    const { scrollLeft, clientWidth } = containerRef.current
    const targetLeft = clientWidth * index
    if (Math.abs(scrollLeft - targetLeft) < 10) {
      unlockProgrammaticScroll()
      return
    }
    const slidesAway = clientWidth > 0 ? Math.abs(targetLeft - scrollLeft) / clientWidth : 0
    // Long jumps (deep links to far slides, e.g. a holder landing on
    // /firstlook from a cold load) snap instantly: an animated sweep
    // across many slides can outlast the programmatic lock, and the
    // scroll handler then hijacks navigation to an intermediate slide.
    // Short hops (dots, arrows, wheel) keep the smooth sweep. The lock
    // ceiling scales with distance as a second line of defence.
    const instant = slidesAway > 2
    lockProgrammaticScroll(targetLeft, instant ? PROGRAMMATIC_SCROLL_TIMEOUT : 2500 + slidesAway * 1500)
    containerRef.current.scrollTo({ left: targetLeft, behavior: instant ? 'auto' : 'smooth' })
  }, [lockProgrammaticScroll, unlockProgrammaticScroll])

  useEffect(() => {
    if (!enabled) return
    scrollToSlide(currentSlide)
    // On a cold deep link (e.g. /mint) the first scroll attempt can fire
    // while the Suspense fallback is still mounted, when the container is
    // only one slide wide and the target clamps to 0. Retry briefly so the
    // scroll lands once the lazy slides have mounted.
    const retryTimers = [350, 900, 1800, 3200].map((delay) =>
      window.setTimeout(() => scrollToSlide(currentSlide), delay),
    )
    return () => retryTimers.forEach((t) => window.clearTimeout(t))
  }, [currentSlide, scrollToSlide, enabled])

  useEffect(() => {
    if (!enabled) return
    const container = containerRef.current
    if (!container) return

    const onWheel = (e: WheelEvent) => {
      if (isGalleryOpen) return

      const currentSlideEl = container.children[currentSlide] as HTMLElement
      if (currentSlideEl) {
        const scrollable = currentSlideEl.querySelector('.overflow-y-auto') as HTMLElement
        if (scrollable) {
          const atTop = scrollable.scrollTop <= 0
          const atBottom = scrollable.scrollHeight - scrollable.scrollTop <= scrollable.clientHeight + 1
          const dominantDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY

          if (dominantDelta > 0 && !atBottom) return
          if (dominantDelta < 0 && !atTop) return
        }
      }

      const now = Date.now()
      if (now - lastScrollTime.current < SCROLL_COOLDOWN) {
        e.preventDefault()
        return
      }

      const dominantDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const sensitivity = currentSlide === 0 ? 10 : 20
      if (Math.abs(dominantDelta) < sensitivity) return

      if (dominantDelta > 0 && currentSlide < slidePaths.length - 1) {
        e.preventDefault()
        navigateToSlide(currentSlide + 1)
        lastScrollTime.current = now
      } else if (dominantDelta < 0 && currentSlide > 0) {
        e.preventDefault()
        navigateToSlide(currentSlide - 1)
        lastScrollTime.current = now
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (isGalleryOpen) return
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.repeat) {
        e.preventDefault()
        return
      }

      const target = e.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName
        const isEditable = target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
        if (isEditable) return
      }

      if (e.key === 'ArrowRight' && currentSlide < slidePaths.length - 1) {
        e.preventDefault()
        navigateToSlide(currentSlide + 1)
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        e.preventDefault()
        navigateToSlide(currentSlide - 1)
      }
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [currentSlide, handleScroll, isGalleryOpen, navigateToSlide, slidePaths.length, enabled])

  useEffect(() => {
    return () => {
      if (programmaticScrollTimeoutRef.current !== null) {
        window.clearTimeout(programmaticScrollTimeoutRef.current)
      }
    }
  }, [])

  return { containerRef, scrollProgress }
}
