import { Suspense, lazy, useEffect, useCallback } from 'react'
import { motion, useTransform } from 'framer-motion'
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom'
import { ThirdwebProvider, ConnectButton } from 'thirdweb/react'
import './index.css'

import { StoreProvider, useStore } from './hooks/useStore'
import { useSlideScroll } from './hooks/useSlideScroll'
import NavigationDots from './components/NavigationDots'

const Slide0Hero = lazy(() => import('./features/hero/Slide0Hero'))
const Slide1Story = lazy(() => import('./features/story/Slide1Story'))
const Slide2Genesis = lazy(() => import('./features/genesis/Slide1Genesis'))
const Slide3Mint = lazy(() => import('./features/mint/Slide2Mint'))
const Slide4HBCU = lazy(() => import('./features/community/Slide3HBCU'))
const Slide5Collections = lazy(() => import('./features/gallery/Slide4Collections'))
const SlideMerchShop = lazy(() => import('./features/merch/SlideMerch'))
const Slide6Livestreams = lazy(() => import('./features/community/Slide5Livestreams'))
const SlideLensFeed = lazy(() => import('./features/lens/SlideLens'))
const Slide7Watch = lazy(() => import('./features/watch/Slide6Watch'))
const Slide8Socials = lazy(() => import('./features/community/Slide6Socials'))
const SlideVaultLocker = lazy(() => import('./features/vault/SlideVault'))

const SLIDE_PATHS = ['/', '/story', '/genesis', '/mint', '/community', '/art', '/merch', '/live', '/lens', '/watch', '/socials', '/vault']

// Browser chrome colour per slide; written to the theme-color meta tag and
// the document body background so mobile browser UI matches the slide.
const SLIDE_HEX = [
  '#3C0010', // 0: hero (burgundy)
  '#F1C40F', // 1: story (gold)
  '#FE517E', // 2: genesis (pink)
  '#3C0010', // 3: mint (burgundy)
  '#FE517E', // 4: hbcu (pink)
  '#3C0010', // 5: collections (burgundy)
  '#FFFFFF', // 6: merch (white)
  '#FE517E', // 7: live (pink)
  '#000000', // 8: lens (black; new slide, Lens-green accents in-slide)
  '#3C0010', // 9: watch (burgundy)
  '#F1C40F', // 10: socials (gold)
  '#3C0010', // 11: vault (burgundy)
]

// Background colour per slide; applied to the outer shell so the nav footer
// and progress-bar header area always match the visible slide's colour.
const SLIDE_BG = [
  'bg-ohnahji-burgundy', // 0: hero
  'bg-ohnahji-gold',     // 1: story
  'bg-ohnahji-pink',     // 2: genesis
  'bg-ohnahji-burgundy', // 3: mint
  'bg-ohnahji-pink',     // 4: hbcu
  'bg-ohnahji-burgundy', // 5: collections
  'bg-ohnahji-white',    // 6: merch
  'bg-ohnahji-pink',     // 7: live
  'bg-ohnahji-black',    // 8: lens
  'bg-ohnahji-burgundy', // 9: watch
  'bg-ohnahji-gold',     // 10: socials
  'bg-ohnahji-burgundy', // 11: vault
]

// Shared inner-wrapper class for non-hero slides:
// px-10 md:px-16 gives doubled gutters vs. the old px-5 on mobile and generous
// breathing room on wide desktop screens.
// No justify; each slide's own outer div uses min-h-full + justify-center so
// content centers when it fits and scrolls from the top when it overflows.
const SLIDE_INNER = 'h-full overflow-y-auto flex flex-col px-10 md:px-16'

// Shared styling for the fixed wallet button (connect + connected states)
const CONNECT_BUTTON_CLASS = '!bg-ohnahji-gold !text-ohnahji-black !border-[4px] !border-ohnahji-black !rounded-xl !font-black !text-xs !px-3 !py-1.5 !h-auto !shadow-neo-sm !border-solid hover:!shadow-none hover:!translate-x-[2px] hover:!translate-y-[2px] !transition-all'

const AppContent = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { client, chain, currentSlide, setCurrentSlide, isGalleryOpen, setIsGalleryOpen, totalSupply } = useStore()

  const { containerRef, scrollProgress } = useSlideScroll({ slidePaths: SLIDE_PATHS, currentSlide, isGalleryOpen, navigate })
  const progressWidth = useTransform(scrollProgress, [0, 1], ['0%', '100%'])

  // Sync URL path to slide index
  useEffect(() => {
    const idx = SLIDE_PATHS.indexOf(location.pathname)
    if (idx !== -1 && idx !== currentSlide) setCurrentSlide(idx)
  }, [location.pathname, currentSlide, setCurrentSlide])

  // Keep the browser chrome (theme-color meta + body background) on the
  // current slide's colour
  useEffect(() => {
    const hex = SLIDE_HEX[currentSlide]
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex)
    document.body.style.backgroundColor = hex
  }, [currentSlide])

  const onSlideChange = useCallback((index: number) => navigate(SLIDE_PATHS[index]), [navigate])

  return (
    // h-app-shell declares 100vh before 100dvh, so older iOS gets a valid
    // height and newer browsers track the dynamic viewport as browser chrome
    // appears and disappears.
    // flex flex-col: progress bar, slide viewport and nav footer stack in flow.
    // The shell background paints through its safe-area padding, so the area
    // behind the status bar and landscape notch stays on the slide colour
    // while the header strip itself starts inside the safe area.
    <div
      className={`h-app-shell w-full flex flex-col overflow-hidden transition-colors duration-500 ${SLIDE_BG[currentSlide]}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="w-full h-1 bg-transparent z-50 flex-shrink-0">
        <motion.div className="h-full bg-ohnahji-gold" style={{ width: progressWidth }} />
      </div>

      {/* Persistent MINT + wallet buttons; hidden while the genesis gallery
          overlay is open. The fixed row is offset by the top/right
          safe-area insets and sized to fit a 390px phone viewport. */}
      {!isGalleryOpen && (
        <div
          className="fixed top-3 right-3 z-[90] flex items-start gap-2"
          style={{
            top: 'calc(0.75rem + env(safe-area-inset-top))',
            right: 'calc(0.75rem + env(safe-area-inset-right))',
          }}
        >
          <button
            onClick={() => navigate('/mint')}
            className="bg-ohnahji-pink text-ohnahji-white border-[4px] border-ohnahji-black rounded-xl font-black text-xs px-3 py-2 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            aria-label="Go to the mint slide"
          >
            MINT
          </button>
          <ConnectButton
            client={client}
            chain={chain}
            theme="light"
            connectButton={{
              label: 'CONNECT',
              className: CONNECT_BUTTON_CLASS,
            }}
            detailsButton={{
              className: CONNECT_BUTTON_CLASS,
            }}
          />
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar"
        >
          <Suspense fallback={<div className="min-w-full h-full bg-ohnahji-burgundy flex items-center justify-center text-white font-black">LOADING...</div>}>
            {/* Hero: always centered (its content is designed around center layout) */}
            <div className="min-w-full h-full snap-start bg-ohnahji-burgundy">
              <div className="h-full overflow-hidden flex flex-col items-center justify-center px-10 md:px-16 py-8">
                <Slide0Hero />
              </div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-gold">
              <div className={SLIDE_INNER}><Slide1Story /></div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-pink">
              <div className={SLIDE_INNER}><Slide2Genesis totalSupply={totalSupply} onGalleryOpen={setIsGalleryOpen} /></div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-burgundy">
              <div className={SLIDE_INNER}><Slide3Mint /></div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-pink">
              <div className={SLIDE_INNER}><Slide4HBCU /></div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-burgundy">
              <div className={SLIDE_INNER}><Slide5Collections /></div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-white">
              <div className={SLIDE_INNER}><SlideMerchShop /></div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-pink">
              <div className={SLIDE_INNER}><Slide6Livestreams /></div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-black">
              <div className={SLIDE_INNER}><SlideLensFeed /></div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-burgundy">
              <div className={SLIDE_INNER}><Slide7Watch /></div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-gold">
              <div className={SLIDE_INNER}><Slide8Socials /></div>
            </div>

            <div className="min-w-full h-full snap-start bg-ohnahji-burgundy">
              <div className={SLIDE_INNER}><SlideVaultLocker /></div>
            </div>
          </Suspense>
        </div>
      </div>

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
