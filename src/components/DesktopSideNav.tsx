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
// gold text, here set sideways with vertical writing mode so it reads
// along the bar. Like the dock, only the active section gets a label;
// the other sections are dots only, so the bar stays narrow and never
// turns back into a full-name rail. The bar is fixed to the viewport's
// left edge and vertically centered, so it stays put while the desktop
// scroller's inner container scrolls beneath it.
const DesktopSideNav = ({ slideNames, currentSlide, onSlideChange }: DesktopSideNavProps) => {
  return (
    <nav
      aria-label="Site sections"
      className="hidden xl:flex fixed left-4 top-1/2 -translate-y-1/2 z-50"
    >
      <div
        role="navigation"
        aria-label="Timeline navigation"
        className="flex flex-col items-center gap-4 px-3 py-5 rounded-full bg-ohnahji-gold border-[6px] border-ohnahji-black shadow-neo"
      >
        {slideNames.map((name, index) => {
          const active = index === currentSlide
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSlideChange(index)}
              style={{ touchAction: 'manipulation' }}
              className={`group relative flex items-center justify-center transition-all ${
                active ? 'scale-125' : 'opacity-70 hover:opacity-100'
              }`}
              aria-label={`Go to slide ${name}`}
              aria-current={active ? 'step' : undefined}
            >
              <div
                className={`w-4 h-4 border-2 border-ohnahji-black rounded-full transition-all ${
                  active ? 'bg-ohnahji-white scale-110' : 'bg-ohnahji-burgundy'
                }`}
              />
              {/* Active-section label only, sideways along the bar. The
                  chip reuses the dock nameplate's black/gold treatment;
                  it is decorative and aria-hidden because the button's
                  aria-label already names the destination. It remounts
                  per section (key={currentSlide}) so the fade replays on
                  every change, exactly like the dock nameplate. */}
              {active && (
                <motion.span
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  aria-hidden="true"
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-ohnahji-black text-ohnahji-gold text-[10px] font-black px-3 py-1 rounded-full border-2 border-ohnahji-black shadow-neo-sm whitespace-nowrap [writing-mode:vertical-rl] pointer-events-none"
                >
                  {name}
                </motion.span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default DesktopSideNav
