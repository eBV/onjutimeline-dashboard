import React, { Suspense, useCallback, useEffect, useRef } from 'react'
import type { MotionValue } from 'framer-motion'
import { desktopTintAt } from '../lib/tint'
import DesktopSideNav from './DesktopSideNav'

// Large-desktop layout only (min-width 1280px; see App.tsx). The mobile
// and tablet deck is untouched: this component renders instead of the
// horizontal snap pager, never alongside it.
//
// Layout: the bottom dock rotated 90 degrees onto the left edge (see
// DesktopSideNav: gold pill, dots, sideways active label, fixed so it
// stays put while the page scrolls), plus a traditional vertical
// scroller holding one section per slide. Sections flow at natural
// height (min one viewport tall), so long sections (FAQ, Quotes) read
// like a normal page. The side nav lists exactly the sections passed
// in, which App derives from the visible deck: gated sections are
// absent for visitors, About is absent for everyone, Story stays hidden.
//
// Scrollspy: on scroll, the active section is the last one whose top
// has crossed 160px below the container top (below the fixed header).
// A scroll-driven change reports through onScrollSection, which only
// replaces the URL; it never scrolls back, so the page cannot fight
// the user's scroll. A navigation-driven change (side nav click, header
// menu, deep link) scrolls the container to the section instead, with
// the same long-jump snap and retry pattern the mobile deck uses.
// While a programmatic scroll is in flight, scrollspy stays quiet so
// intermediate sections cannot hijack the destination.

export interface DesktopSection {
  path: string
  name: string
  weight?: number
  content: React.ReactNode
}

interface DesktopScrollProps {
  sections: DesktopSection[]
  currentSlide: number
  onSectionChange: (index: number) => void
  onScrollSection: (index: number) => void
  progress: MotionValue<number>
  // The shared shell tint (see src/lib/tint.ts). The desktop scroller
  // owns it while mounted: it writes the section-anchored dissolve
  // colour on every scroll, and maroon while the gallery overlay is
  // open. App's mirror effect leaves the tint alone on desktop so the
  // two writers can never fight.
  tint: MotionValue<string>
  hexes: string[]
  galleryOpen: boolean
}

const HEADER_CLEARANCE = 160
const PROGRAMMATIC_TIMEOUT = 4000

const DesktopScroll = ({
  sections,
  currentSlide,
  onSectionChange,
  onScrollSection,
  progress,
  tint,
  hexes,
  galleryOpen,
}: DesktopScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionEls = useRef<(HTMLElement | null)[]>([])
  const currentSlideRef = useRef(currentSlide)
  const scrollDrivenRef = useRef<number | null>(null)
  const programmaticRef = useRef(false)
  const programmaticTargetRef = useRef<number | null>(null)
  const programmaticTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    currentSlideRef.current = currentSlide
  }, [currentSlide])

  const clearProgrammatic = useCallback(() => {
    programmaticRef.current = false
    programmaticTargetRef.current = null
    if (programmaticTimeoutRef.current !== null) {
      window.clearTimeout(programmaticTimeoutRef.current)
      programmaticTimeoutRef.current = null
    }
  }, [])

  const lockProgrammatic = useCallback(
    (target: number) => {
      programmaticRef.current = true
      programmaticTargetRef.current = target
      if (programmaticTimeoutRef.current !== null) {
        window.clearTimeout(programmaticTimeoutRef.current)
      }
      programmaticTimeoutRef.current = window.setTimeout(clearProgrammatic, PROGRAMMATIC_TIMEOUT)
    },
    [clearProgrammatic],
  )

  const sectionTop = useCallback((index: number): number | null => {
    const container = containerRef.current
    const el = sectionEls.current[index]
    if (!container || !el) return null
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    return elRect.top - containerRect.top + container.scrollTop
  }, [])

  const syncActiveFromScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    let active = 0
    sectionEls.current.forEach((el, i) => {
      if (!el) return
      if (el.getBoundingClientRect().top - containerRect.top <= HEADER_CLEARANCE) active = i
    })
    if (active !== currentSlideRef.current) {
      scrollDrivenRef.current = active
      onScrollSection(active)
    }
  }, [onScrollSection])

  // Section-anchored dissolve: tops are the scrollTop values where
  // each section's top aligns with the container top. Sections that
  // have not mounted yet (lazy chunks) report null and skip the
  // update; the sections-change effect below recomputes once they land.
  const updateTint = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (galleryOpen) {
      tint.set('#3C0010')
      return
    }
    const tops: number[] = []
    for (let i = 0; i < sections.length; i++) {
      const top = sectionTop(i)
      if (top === null) return
      tops.push(top)
    }
    tint.set(desktopTintAt(tops, hexes, container.scrollTop, container.clientHeight))
  }, [galleryOpen, hexes, sectionTop, sections.length, tint])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    progress.set(scrollHeight - clientHeight > 0 ? scrollTop / (scrollHeight - clientHeight) : 0)
    updateTint()
    if (programmaticRef.current) {
      const target = programmaticTargetRef.current
      if (target !== null && Math.abs(scrollTop - target) < 10) clearProgrammatic()
      return
    }
    syncActiveFromScroll()
  }, [clearProgrammatic, progress, syncActiveFromScroll, updateTint])

  const scrollToSection = useCallback(
    (index: number) => {
      const container = containerRef.current
      if (!container) return
      const target = sectionTop(index)
      if (target === null) return
      if (Math.abs(container.scrollTop - target) < 10) {
        clearProgrammatic()
        return
      }
      const far = Math.abs(target - container.scrollTop) > 2 * container.clientHeight
      lockProgrammatic(target)
      container.scrollTo({ top: target, behavior: far ? 'auto' : 'smooth' })
    },
    [clearProgrammatic, lockProgrammatic, sectionTop],
  )

  // Navigation-driven moves scroll; scroll-driven moves (flagged by
  // the scrollspy) do not scroll back. Retries cover cold deep links
  // whose lazy sections have not mounted yet.
  useEffect(() => {
    if (currentSlide === scrollDrivenRef.current) return
    scrollToSection(currentSlide)
    const retryTimers = [350, 900, 1800, 3200].map((delay) =>
      window.setTimeout(() => {
        if (currentSlide !== scrollDrivenRef.current) scrollToSection(currentSlide)
      }, delay),
    )
    return () => retryTimers.forEach((t) => window.clearTimeout(t))
  }, [currentSlide, scrollToSection])

  // A deck change (holder connect appends gated sections) reshapes the
  // page without scrolling; re-derive the active section and the tint
  // once laid out. Gallery open/close also recomputes the tint at once
  // instead of waiting for the next scroll.
  useEffect(() => {
    if (programmaticRef.current) return
    const raf = requestAnimationFrame(() => {
      syncActiveFromScroll()
      updateTint()
    })
    return () => cancelAnimationFrame(raf)
  }, [sections, syncActiveFromScroll, updateTint])

  useEffect(() => {
    updateTint()
  }, [updateTint])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(
    () => () => {
      if (programmaticTimeoutRef.current !== null) {
        window.clearTimeout(programmaticTimeoutRef.current)
      }
    },
    [],
  )

  return (
    <div className="h-full w-full flex">
      {/* Desktop nav: the dock rotated onto the left edge. Fixed to the
          viewport and vertically centered, so it stays put while the
          scroller's inner container scrolls. Section content keeps a
          wide left pad (xl:pl-28) so nothing slides under the bar. */}
      <DesktopSideNav
        slideNames={sections.map((section) => section.name)}
        currentSlide={currentSlide}
        onSlideChange={onSectionChange}
      />

      <div ref={containerRef} className="flex-1 h-full overflow-y-auto desktop-scroll-container">
        {sections.map((section, i) => (
          <section
            key={section.path}
            data-path={section.path}
            ref={(el) => {
              sectionEls.current[i] = el
            }}
            className="min-h-dvh flex flex-col"
            style={
              section.weight ? ({ '--slide-weight': section.weight } as React.CSSProperties) : undefined
            }
          >
            <div className="flex-1 flex flex-col px-10 xl:px-16 xl:pl-28">
              <Suspense
                fallback={
                  <div className="flex-1 flex items-center justify-center text-white font-black">
                    LOADING...
                  </div>
                }
              >
                {section.content}
              </Suspense>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default DesktopScroll
