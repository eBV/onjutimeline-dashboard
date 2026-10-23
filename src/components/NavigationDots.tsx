import { motion } from 'framer-motion'

interface NavigationDotsProps {
  totalSlides: number
  currentSlide: number
  onSlideChange: (index: number) => void
}

const NavigationDots = ({ totalSlides, currentSlide, onSlideChange }: NavigationDotsProps) => {
  const slideNames = ['ONJU', 'STORY', 'GENESIS', 'MINT', 'HBCU', 'ART', 'MERCH', 'LIVE', 'LENS', 'WATCH', 'SOCIALS', 'VAULT']
  const isSocials = currentSlide === 10

  return (
    <div
      className="w-full flex items-center justify-center px-4 py-3 z-50"
      style={{
        paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
      }}
    >
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
            <div className={`absolute -top-12 bg-ohnahji-black text-ohnahji-gold text-[10px] font-black px-3 py-1 rounded-full border-2 border-ohnahji-black pointer-events-none transition-all transform whitespace-nowrap shadow-neo-sm ${currentSlide === index ? 'opacity-100 -translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
              {slideNames[index]}
            </div>
          </button>
        ))}
      </motion.div>
    </div>
  )
}

export default NavigationDots
