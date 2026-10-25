import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface NavigationDotsProps {
  totalSlides: number
  // Names come from the visible deck in App: the deck is dynamic (gated
  // slides append for OG holders), so names must never be hardcoded here.
  slideNames: string[]
  isSocials: boolean
  currentSlide: number
  onSlideChange: (index: number) => void
}

// CSS anchor positioning (Chrome 125+, Safari 26+, modern Edge) is the
// PRIMARY nameplate placement: the label's left edge is anchored to the
// active dot's center in pure CSS, so it cannot drift to the pill center
// no matter what the JS measurement path does. The JS measurement below
// is the fallback for browsers without anchor support. Both layers center
// on the dot; neither centers on the pill.
const ANCHOR_SUPPORTED =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  (CSS.supports('position-anchor: --active-dot') ||
    CSS.supports('anchor-name: --active-dot'))

const NavigationDots = ({ totalSlides, slideNames, isSocials, currentSlide, onSlideChange }: NavigationDotsProps) => {
  // The nameplate must sit centered exactly on the active dot, not on the
  // dock pill. An earlier revision centered it on the pill (left-1/2) to
  // dodge edge clipping, which is the drift the owner reported: on slide 0
  // the label sat over the middle of the strip while the active dot was far
  // left. The anchor layer (see ANCHOR_SUPPORTED) now pins the label to
  // the dot in CSS; the JS layer below still measures the real active dot
  // on every slide change, resize, and deck change for browsers without
  // anchor support. Dots are laid out by flex, so only a live anchor or
  // measurement tracks them across viewport widths and deck sizes (the
  // deck grew to 14 slides, which is what exposed the container-centering).
  // The one exception is edge dots with long labels: exact centering
  // there would push the label off-screen, so the JS center is clamped to
  // the viewport with a 2px margin instead (the anchor layer has no clamp;
  // on the widest decks an edge label may touch the screen edge, which is
  // strictly better than drifting to the pill center). The vertical
  // placement (straddling the dock's top edge) is unchanged.
  const wrapRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [labelLeft, setLabelLeft] = useState<number | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      // Anchor-capable browsers never need the JS position: the CSS
      // anchor pins the label to the dot, and an inline left would beat
      // the anchor rule, so leave labelLeft null on that path.
      if (ANCHOR_SUPPORTED) return
      const wrap = wrapRef.current
      const dot = dotRefs.current[currentSlide]
      const label = labelRef.current
      if (!wrap || !dot || !label) return
      const wrapRect = wrap.getBoundingClientRect()
      const dotRect = dot.getBoundingClientRect()
      // offsetWidth, not getBoundingClientRect().width: the label mounts
      // with a framer-motion scale animation (0.7 to 1), and a bounding rect
      // measured mid-animation is too narrow, which corrupts the edge
      // clamps below. Layout width is transform-independent, so the clamp
      // is right from the first frame. Dot centers are transform-safe too
      // (the active dot scales about its own center).
      const labelWidth = label.offsetWidth
      if (wrapRect.width <= 0 || dotRect.width <= 0 || labelWidth <= 0) return
      const dotCenter = dotRect.left + dotRect.width / 2 - wrapRect.left
      const half = labelWidth / 2
      // Clamp to the viewport (2px margin), expressed in wrapper coords, so
      // the label can never clip off-screen on the first/last dots.
      const min = half + 2 - wrapRect.left
      const max = window.innerWidth - 2 - half - wrapRect.left
      const clamped = Math.min(Math.max(dotCenter, min), max)
      setLabelLeft((prev) => (prev === clamped ? prev : clamped))
    }
    measure()
    const wrap = wrapRef.current
    const label = labelRef.current
    // A webfont swap can widen the label after mount; re-measure then too.
    let cancelled = false
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure()
      }).catch(() => {})
    }
    if (typeof ResizeObserver === 'undefined' || !wrap) return () => { cancelled = true }
    const observer = new ResizeObserver(measure)
    observer.observe(wrap)
    if (label) observer.observe(label)
    return () => {
      cancelled = true
      observer.disconnect()
    }
    // slideNames.length covers deck growth; the label remounts per slide
    // (key={currentSlide}) so its own width is re-measured each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, totalSlides, slideNames.length])

  return (
    <div
      // Bottom clearance comes from .dock-footer-pad (index.css): the base
      // safe-area formula everywhere, lifted to a fixed 88px in browser mode
      // on phone widths so iOS Safari's floating toolbar cannot cover the
      // dock. Left/right keep their inline safe-area calc.
      className="w-full flex items-center justify-center px-4 pt-3 z-50 dock-footer-pad pointer-events-none"
      style={{
        paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
      }}
    >
      <div className="relative pointer-events-auto" ref={wrapRef}>
        {/* Active-slide nameplate, centered on the active dot (see the
            anchor + measurement notes above). The buttons keep their
            aria-labels, so the chip is decorative and aria-hidden. On
            anchor-capable browsers the [position-anchor] / anchor() classes
            pin it to the dot with no JS; elsewhere the JS measurement
            writes the inline left. Until the first fallback measurement
            lands there is no inline left, so the label sits at its static
            position behind the fade-in animation. */}
        <motion.div
          key={currentSlide}
          ref={labelRef}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ left: labelLeft ?? undefined, x: '-50%', y: '-50%' }}
          className="absolute top-0 z-20 bg-ohnahji-black text-ohnahji-gold text-[10px] font-black px-3 py-1 rounded-full border-2 border-ohnahji-black shadow-neo-sm whitespace-nowrap pointer-events-none [position-anchor:--active-dot] left-[anchor(--active-dot_center)]"
          aria-hidden="true"
        >
          {slideNames[currentSlide]}
        </motion.div>

        <motion.div
          animate={isSocials ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
          transition={isSocials ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          className={`flex items-center justify-center gap-2.5 sm:gap-6 px-4 sm:px-8 py-3 sm:py-4 rounded-full transition-all duration-300 ${
            isSocials
              ? 'bg-transparent'
              : 'bg-ohnahji-gold border-[6px] border-ohnahji-black shadow-neo'
          }`}
          role="navigation"
          aria-label="Timeline navigation"
        >
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              ref={(el) => {
                dotRefs.current[index] = el
              }}
              onClick={() => onSlideChange(index)}
              style={{ touchAction: 'manipulation' }}
              className={`group relative flex flex-col items-center transition-all ${currentSlide === index ? 'scale-125' : 'opacity-70 hover:opacity-100'
                }`}
              aria-label={`Go to slide ${slideNames[index]}`}
              aria-current={currentSlide === index ? 'step' : undefined}
            >
              <div
                className={`w-4 h-4 border-2 border-ohnahji-black rounded-full transition-all ${currentSlide === index ? 'bg-ohnahji-white scale-110 [anchor-name:--active-dot]' : 'bg-ohnahji-burgundy'
                  }`}
              />
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default NavigationDots
