import { motion } from 'framer-motion'

interface NavigationDotsProps {
  totalSlides: number
  currentSlide: number
  onSlideChange: (index: number) => void
}

const NavigationDots = ({ totalSlides, currentSlide, onSlideChange }: NavigationDotsProps) => {
  const slideNames = ['ONJU', 'STORY', 'GENESIS', 'MINT', 'HBCU', 'ART', 'LIVE', 'WATCH', 'SOCIALS']

  return (
    <div className="w-full flex items-center justify-center px-4 py-3 z-50">
      <div
        className="flex items-center justify-center gap-3 px-5 py-2.5 rounded-full"
        style={{ background: '#161616', border: '1px solid #2a2a2a' }}
        role="navigation"
        aria-label="Timeline navigation"
      >
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => onSlideChange(index)}
            style={{ touchAction: 'manipulation' }}
            className="group relative flex flex-col items-center"
            aria-label={`Go to slide ${slideNames[index]}`}
            aria-current={currentSlide === index ? 'step' : undefined}
          >
            <motion.div
              animate={currentSlide === index
                ? { scale: 1.3, backgroundColor: '#FE517E' }
                : { scale: 1, backgroundColor: '#444444' }
              }
              transition={{ duration: 0.2 }}
              className="w-2.5 h-2.5 rounded-full"
            />
            <div
              className={`absolute -top-9 text-white text-[10px] font-bold px-2.5 py-1 rounded-md pointer-events-none whitespace-nowrap transition-all duration-150 ${
                currentSlide === index
                  ? 'opacity-100 -translate-y-0'
                  : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
              }`}
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
            >
              {slideNames[index]}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default NavigationDots
