import { useState } from 'react'
import { motion } from 'framer-motion'

interface DesktopSideNavProps {
  // Names come from the visible deck in App: the deck is dynamic (gated
  // slides append for OG holders), so names must never be hardcoded here.
  slideNames: string[]
  currentSlide: number
  onSlideChange: (index: number) => void
}

// The desktop left nav is the bottom dock rotated 90 degrees, not a new
// navigation design. It reuses the dock's own pieces verbatim: the gold
// pill (bg-ohnahji-gold, 6px black border, neo shadow), the burgundy
// dots with a white scaled active dot, and the black nameplate with
// gold text. The bar is fixed to the viewport's left edge and
// vertically centered, so it stays put while the desktop scroller's
// inner container scrolls beneath it.
//
// Hover tray (desktop only; this component never renders below xl):
// hovering the bar widens the yellow pill itself like a tray expanding
// rightward, with the same S-curve framer-motion easing the site
// already uses (easeInOut). A label appears next to every dot inside
// the expanded tray, in the nameplate's black pill and gold text
// treatment, so the tray reads as one piece; the active row's label
// carries a white ring on top of that treatment, matching how the
// active dot stands out. While the tray is expanded the standalone
// active label pill hides, so no label appears twice. Hover-out
// collapses the tray back to dots plus the single active label pill.
// The trigger is hover only: there is no tap, click, or always-visible
// variant, so on touch-only devices the bar simply stays collapsed
// and the dots still navigate.
const COLLAPSED_WIDTH = 52
const EXPANDED_WIDTH = 200

const DesktopSideNav = ({ slideNames, currentSlide, onSlideChange }: DesktopSideNavProps) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <nav
      aria-label="Site sections"
      className="hidden xl:flex fixed left-4 top-1/2 -translate-y-1/2 z-50"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <motion.div
        role="navigation"
        aria-label="Timeline navigation"
        animate={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className={`flex flex-col items-stretch gap-4 px-3 py-5 rounded-2xl bg-ohnahji-gold border-[6px] border-ohnahji-black shadow-neo ${
          expanded ? 'overflow-hidden' : 'overflow-visible'
        }`}
      >
        {slideNames.map((name, index) => {
          const active = index === currentSlide
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSlideChange(index)}
              className={`group relative flex items-center gap-3 transition-all ${
                active ? '' : 'opacity-70 hover:opacity-100'
              }`}
              aria-label={`Go to slide ${name}`}
              aria-current={active ? 'step' : undefined}
            >
              <div
                className={`shrink-0 w-4 h-4 border-2 border-ohnahji-black rounded-full transition-all ${
                  active ? 'bg-ohnahji-white scale-110' : 'bg-ohnahji-burgundy'
                }`}
              />
              {/* Tray label: appears next to every dot inside the
                  expanded tray, in the nameplate's black pill and gold
                  text treatment. Decorative and aria-hidden because
                  the button's aria-label already names the
                  destination. It mounts with the tray expansion and
                  fades in alongside the widening. */}
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  aria-hidden="true"
                  className={`bg-ohnahji-black text-ohnahji-gold text-xs font-black px-3 py-1 rounded-full border-2 whitespace-nowrap pointer-events-none ${
                    active ? 'ring-2 ring-ohnahji-white' : 'border-ohnahji-black'
                  }`}
                >
                  {name}
                </motion.span>
              )}
              {/* Collapsed active-section label only, horizontal beside
                  the dot so it reads normally left to right. The chip
                  reuses the dock nameplate's black/gold treatment; it
                  is decorative and aria-hidden because the button's
                  aria-label already names the destination. It
                  remounts per section (key={currentSlide}) so the
                  fade replays on every change, exactly like the dock
                  nameplate. Hidden while the tray is expanded, since
                  the tray already names every section. */}
              {active && !expanded && (
                <motion.span
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  aria-hidden="true"
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-ohnahji-black text-ohnahji-gold text-[10px] font-black px-3 py-1 rounded-full border-2 border-ohnahji-black shadow-neo-sm whitespace-nowrap pointer-events-none"
                >
                  {name}
                </motion.span>
              )}
            </button>
          )
        })}
      </motion.div>
    </nav>
  )
}

export default DesktopSideNav
