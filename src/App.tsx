import { Suspense, lazy, useEffect, useCallback } from 'react'
import { motion, useTransform } from 'framer-motion'
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom'
import { ThirdwebProvider } from 'thirdweb/react'
import './index.css'

import { ConnectButton } from 'thirdweb/react'
import { StoreProvider, useStore } from './hooks/useStore'
import { useSlideScroll } from './hooks/useSlideScroll'
import NavigationDots from './components/NavigationDots'

const Slide0Hero = lazy(() => import('./features/hero/Slide0Hero'))
const Slide1Story = lazy(() => import('./features/story/Slide1Story'))
const Slide2Genesis = lazy(() => import('./features/genesis/Slide1Genesis'))
const Slide3Mint = lazy(() => import('./features/mint/Slide2Mint'))
const Slide4HBCU = lazy(() => import('./features/community/Slide3HBCU'))
const Slide5Collections = lazy(() => import('./features/gallery/Slide4Collections'))
const Slide6Livestreams = lazy(() => import('./features/community/Slide5Livestreams'))
const Slide7Watch = lazy(() => import('./features/watch/Slide6Watch'))
const Slide8Socials = lazy(() => import('./features/community/Slide6Socials'))

const SLIDE_PATHS = ['/', '/story', '/genesis', '/mint', '/community', '/art', '/live', '/watch', '/socials']

// Background colour per slide — applied to the outer shell so the nav footer
// and progress-bar header area always match the visible slide's colour.
// Hex colours matching each slide — used for dynamic theme-color + body bg
// so iOS safe areas / browser chrome always match the visible slide.
const SLIDE_HEX = [
  '#0D0D0D', // 0: hero
  '#0D0D0D', // 1: story
  '#0D0D0D', // 2: genesis
  '#0D0D0D', // 3: mint
  '#0D0D0D', // 4: hbcu
  '#0D0D0D', // 5: art
  '#0D0D0D', // 6: live
  '#0D0D0D', // 7: watch
  '#0D0D0D', // 8: socials
]

const SLIDE_BG = [
  'bg-dash-bg', // 0: hero
  'bg-dash-bg', // 1: story
  'bg-dash-bg', // 2: genesis
  'bg-dash-bg', // 3: mint
  'bg-dash-bg', // 4: hbcu
  'bg-dash-bg', // 5: collections
  'bg-dash-bg', // 6: live
  'bg-dash-bg', // 7: watch
  'bg-dash-bg', // 8: socials
]

// Shared inner-wrapper class for non-hero slides:
// px-10 md:px-16 gives doubled gutters vs. the old px-5 on mobile and generous
// breathing room on wide desktop screens.
// No justify — each slide's own outer div uses min-h-full + justify-center so
// content centers when it fits and scrolls from the top when it overflows.
const SLIDE_INNER = 'h-full overflow-y-auto flex flex-col px-10 md:px-16'

const AppContent = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { client, chain, currentSlide, setCurrentSlide, isGalleryOpen, setIsGalleryOpen, totalSupply } = useStore()

  const { containerRef, scrollProgress } = useSlideScroll({ slidePaths: SLIDE_PATHS, currentSlide, isGalleryOpen, navigate })
  const progressWidth = useTransform(scrollProgress, [0, 1], ['0%', '100%'])

  // Sync URL path → slide index
  useEffect(() => {
    const idx = SLIDE_PATHS.indexOf(location.pathname)
    if (idx !== -1 && idx !== currentSlide) setCurrentSlide(idx)
  }, [location.pathname, currentSlide, setCurrentSlide])

  // Keep browser chrome + iOS safe areas in sync with the current slide colour
  useEffect(() => {
    const hex = SLIDE_HEX[currentSlide]
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex)
    document.body.style.backgroundColor = hex
  }, [currentSlide])

  const onSlideChange = useCallback((index: number) => navigate(SLIDE_PATHS[index]), [navigate])

  return (
    <div className={`h-dvh w-screen flex flex-col overflow-hidden transition-colors duration-500 ${SLIDE_BG[currentSlide]}`}>
      {/* Progress bar — 1px top strip */}
      <div className="w-full h-[2px] bg-transparent z-50 flex-shrink-0">
        <motion.div className="h-full bg-ohnahji-pink" style={{ width: progressWidth }} />
      </div>

      {/* Persistent wallet button — top-right, hidden when gallery is open */}
      {!isGalleryOpen && (
        <div className="fixed top-3 right-3 z-[90]">
          <ConnectButton
            client={client}
            chain={chain}
            theme="dark"
            connectButton={{
              label: "CONNECT",
              className: "!bg-transparent !text-ohnahji-pink !border !border-ohnahji-pink/40 !rounded-lg !font-bold !text-xs !px-3 !py-1.5 !h-auto hover:!bg-ohnahji-pink/10 !transition-all",
            }}
            detailsButton={{
              className: "!bg-transparent !text-ohnahji-pink !border !border-ohnahji-pink/40 !rounded-lg !font-bold !text-xs !px-3 !py-1.5 !h-auto hover:!bg-ohnahji-pink/10 !transition-all",
            }}
          />
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar"
        >
          <Suspense fallback={<div className="min-w-full h-full bg-dash-bg flex items-center justify-center text-white/40 font-bold text-sm">Loading...</div>}>
            {/* 0: Hero */}
            <div className="min-w-full h-full snap-start bg-dash-bg">
              <div className={SLIDE_INNER}><Slide0Hero /></div>
            </div>

            {/* 1: Story */}
            <div className="min-w-full h-full snap-start bg-dash-bg">
              <div className={SLIDE_INNER}><Slide1Story /></div>
            </div>

            {/* 2: Genesis */}
            <div className="min-w-full h-full snap-start bg-dash-bg">
              <div className={SLIDE_INNER}><Slide2Genesis totalSupply={totalSupply} onGalleryOpen={setIsGalleryOpen} /></div>
            </div>

            {/* 3: Mint */}
            <div className="min-w-full h-full snap-start bg-dash-bg">
              <div className={SLIDE_INNER}><Slide3Mint /></div>
            </div>

            {/* 4: HBCU */}
            <div className="min-w-full h-full snap-start bg-dash-bg">
              <div className={SLIDE_INNER}><Slide4HBCU /></div>
            </div>

            {/* 5: Art */}
            <div className="min-w-full h-full snap-start bg-dash-bg">
              <div className={SLIDE_INNER}><Slide5Collections /></div>
            </div>

            {/* 6: Live */}
            <div className="min-w-full h-full snap-start bg-dash-bg">
              <div className={SLIDE_INNER}><Slide6Livestreams /></div>
            </div>

            {/* 7: Watch */}
            <div className="min-w-full h-full snap-start bg-dash-bg">
              <div className={SLIDE_INNER}><Slide7Watch /></div>
            </div>

            {/* 8: Socials */}
            <div className="min-w-full h-full snap-start bg-dash-bg">
              <div className={SLIDE_INNER}><Slide8Socials /></div>
            </div>
          </Suspense>
        </div>
      </div>

      {/* Nav dots — bottom of flex column, always visible, never overlaps slides */}
      <NavigationDots totalSlides={SLIDE_PATHS.length} currentSlide={currentSlide} onSlideChange={onSlideChange} />
    </div>
  )
}

function App() {
  return (
    <StoreProvider>
      <ThirdwebProvider>
        <Router>
          <AppContent />
        </Router>
      </ThirdwebProvider>
    </StoreProvider>
  )
}

export default App
