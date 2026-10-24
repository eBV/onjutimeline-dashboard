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

const NavigationDots = ({ totalSlides, slideNames, isSocials, currentSlide, onSlideChange }: NavigationDotsProps) => {

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
      <div className="relative pointer-events-auto">
        {/* Active-slide nameplate. Previously this label hung off whichever
            dot was active, so on the first/last slides it sat at the screen
            edge, half-clipped and visually detached from the dock. It is now
            a single chip riveted to the top centre of the dock pill itself:
            always centred, never within reach of an edge, and unmistakably
            part of the dock assembly. The buttons keep their aria-labels, so
            the chip is decorative and aria-hidden. */}
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ x: '-50%', y: '-50%' }}
          className="absolute left-1/2 top-0 z-20 bg-ohnahji-black text-ohnahji-gold text-[10px] font-black px-3 py-1 rounded-full border-2 border-ohnahji-black shadow-neo-sm whitespace-nowrap pointer-events-none"
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
              onClick={() => onSlideChange(index)}
              style={{ touchAction: 'manipulation' }}
              className={`group relative flex flex-col items-center transition-all ${currentSlide === index ? 'scale-125' : 'opacity-70 hover:opacity-100'
                }`}
              aria-label={`Go to slide ${slideNames[index]}`}
              aria-current={currentSlide === index ? 'step' : undefined}
            >
              <div
                className={`w-4 h-4 border-2 border-ohnahji-black rounded-full transition-all ${currentSlide === index ? 'bg-ohnahji-white scale-110' : 'bg-ohnahji-burgundy'
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
