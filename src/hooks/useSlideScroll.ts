import { useRef, useEffect, useCallback, RefObject } from 'react'
import { useMotionValue, MotionValue } from 'framer-motion'

interface UseSlideScrollOptions {
  slidePaths: string[]
  currentSlide: number
  isGalleryOpen: boolean
  navigate: (path: string, options?: { replace: boolean }) => void
}

interface UseSlideScrollResult {
  containerRef: RefObject<HTMLDivElement>
  scrollProgress: MotionValue<number>
}

const SCROLL_COOLDOWN = 1000
const PROGRAMMATIC_SCROLL_DURATION = 600

export function useSlideScroll({
  slidePaths,
  currentSlide,
  isGalleryOpen,
  navigate,
}: UseSlideScrollOptions): UseSlideScrollResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollProgress = useMotionValue(0)
  const lastScrollTime = useRef(0)
  const isProgrammaticScroll = useRef(false)
  const programmaticScrollTimeoutRef = useRef<number | null>(null)

  const lockProgrammaticScroll = useCallback(() => {
    isProgrammaticScroll.current = true
    if (programmaticScrollTimeoutRef.current !== null) {
      window.clearTimeout(programmaticScrollTimeoutRef.current)
    }
    programmaticScrollTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScroll.current = false
      programmaticScrollTimeoutRef.current = null
    }, PROGRAMMATIC_SCROLL_DURATION)
  }, [])

  const navigateToSlide = useCallback((index: number) => {
    if (!slidePaths[index] || index === currentSlide) return
    lockProgrammaticScroll()
    navigate(slidePaths[index])
  }, [currentSlide, lockProgrammaticScroll, navigate, slidePaths])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
    scrollProgress.set(scrollWidth - clientWidth > 0 ? scrollLeft / (scrollWidth - clientWidth) : 0)

    if (isProgrammaticScroll.current) return

    if (clientWidth > 0) {
      const newSlideIndex = Math.round(scrollLeft / clientWidth)
      if (newSlideIndex !== currentSlide && slidePaths[newSlideIndex]) {
        navigate(slidePaths[newSlideIndex], { replace: true })
      }
    }
  }, [currentSlide, navigate, scrollProgress, slidePaths])

  const scrollToSlide = useCallback((index: number) => {
    if (!containerRef.current) return
    const { scrollLeft, clientWidth } = containerRef.current
    const targetLeft = clientWidth * index
    if (Math.abs(scrollLeft - targetLeft) < 10) {
      isProgrammaticScroll.current = false
      if (programmaticScrollTimeoutRef.current !== null) {
        window.clearTimeout(programmaticScrollTimeoutRef.current)
        programmaticScrollTimeoutRef.current = null
      }
      return
    }
    lockProgrammaticScroll()
    containerRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' })
  }, [lockProgrammaticScroll])

  useEffect(() => {
    scrollToSlide(currentSlide)
  }, [currentSlide, scrollToSlide])

  useEffect(() => {
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
  }, [currentSlide, handleScroll, isGalleryOpen, navigateToSlide, slidePaths.length])

  useEffect(() => {
    return () => {
      if (programmaticScrollTimeoutRef.current !== null) {
        window.clearTimeout(programmaticScrollTimeoutRef.current)
      }
    }
  }, [])

  return { containerRef, scrollProgress }
}
