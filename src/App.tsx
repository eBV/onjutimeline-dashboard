import React, { Suspense, lazy, useEffect, useCallback, useMemo, useState } from 'react'
import { motion, useTransform, useMotionValueEvent } from 'framer-motion'
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom'
import { ThirdwebProvider, ConnectButton } from 'thirdweb/react'
import './index.css'

import { StoreProvider, useStore } from './hooks/useStore'
import { HolderProvider, useHolderStatus } from './hooks/useHolderStatus'
import { useSlideScroll } from './hooks/useSlideScroll'
import NavigationDots from './components/NavigationDots'
import { visibleSlides, GATED_PATHS, SlideMeta } from './lib/deck'

const Slide0Hero = lazy(() => import('./features/hero/Slide0Hero'))
const Slide1Story = lazy(() => import('./features/story/Slide1Story'))
const Slide2Genesis = lazy(() => import('./features/genesis/Slide1Genesis'))
const Slide3Mint = lazy(() => import('./features/mint/Slide2Mint'))
const Slide4HBCU = lazy(() => import('./features/community/Slide3HBCU'))
const Slide5Collections = lazy(() => import('./features/gallery/Slide4Collections'))
const SlideMerchShop = lazy(() => import('./features/merch/SlideMerch'))
const Slide6Livestreams = lazy(() => import('./features/community/Slide5Livestreams'))
const SlideLensFeed = lazy(() => import('./features/lens/SlideLens'))
const SlideQuotesFeed = lazy(() => import('./features/quotes/SlideQuotes'))
const Slide8Socials = lazy(() => import('./features/community/Slide6Socials'))
const SlideVaultLocker = lazy(() => import('./features/vault/SlideVault'))
const SlideFirstLook = lazy(() => import('./features/firstlook/SlideFirstLook'))

// Shared inner-wrapper class for non-hero slides:
// px-10 md:px-16 gives doubled gutters vs. the old px-5 on mobile and generous
// breathing room on wide desktop screens.
// No justify; each slide's own outer div uses min-h-full + justify-center so
// content centers when it fits and scrolls from the top when it overflows.
const SLIDE_INNER = 'h-full overflow-y-auto flex flex-col px-10 md:px-16'
const HERO_INNER = 'h-full overflow-hidden flex flex-col items-center justify-center px-10 md:px-16 py-8'

// A visible slide: deck metadata (src/lib/deck.ts) plus its rendered body.
interface SlideDef extends SlideMeta {
  innerClass: string
  content: React.ReactNode
}

// Shared styling for the fixed wallet button (connect + connected states)
const CONNECT_BUTTON_CLASS = '!bg-ohnahji-gold !text-ohnahji-black !border-[4px] !border-ohnahji-black !rounded-xl !font-black !text-xs !px-3 !py-1.5 !h-auto !shadow-neo-sm !border-solid hover:!shadow-none hover:!translate-x-[2px] hover:!translate-y-[2px] !transition-all'

const AppContent = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { client, chain, currentSlide, setCurrentSlide, isGalleryOpen, setIsGalleryOpen, totalSupply } = useStore()
  const { isHolder, isPending } = useHolderStatus()

  const slides = useMemo<SlideDef[]>(() => {
    const contentByPath: Record<string, React.ReactNode> = {
      '/': <Slide0Hero />,
      '/story': <Slide1Story />,
      '/genesis': <Slide2Genesis totalSupply={totalSupply} onGalleryOpen={setIsGalleryOpen} />,
      '/mint': <Slide3Mint />,
      '/community': <Slide4HBCU />,
      '/art': <Slide5Collections />,
      '/merch': <SlideMerchShop />,
      '/live': <Slide6Livestreams />,
      '/lens': <SlideLensFeed />,
      '/quotes': <SlideQuotesFeed />,
      '/socials': <Slide8Socials />,
      '/vault': <SlideVaultLocker />,
      '/firstlook': <SlideFirstLook />,
    }
    return visibleSlides(isHolder).map((meta) => ({
      ...meta,
      innerClass: meta.path === '/' ? HERO_INNER : SLIDE_INNER,
      content: contentByPath[meta.path],
    }))
  }, [isHolder, totalSupply, setIsGalleryOpen])

  // Cold-load grace for gated deep links: at first paint the wallet
  // session has not started restoring yet, so neither "account present"
  // nor "auto-connecting" reads true for a beat, and judging a gated
  // path inside that window would bounce real holders home before
  // their session lands. Gated paths get a short window to resolve.
  const [graceOver, setGraceOver] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setGraceOver(true), 3000)
    return () => clearTimeout(t)
  }, [])

  const slidePaths = useMemo(() => slides.map((s) => s.path), [slides])
  const slideHex = useMemo(() => slides.map((s) => s.hex), [slides])
  const slideNames = useMemo(() => slides.map((s) => s.name), [slides])

  const { containerRef, scrollProgress } = useSlideScroll({ slidePaths, currentSlide, isGalleryOpen, navigate })
  const progressWidth = useTransform(scrollProgress, [0, 1], ['0%', '100%'])

  // Continuous chrome tint. scrollProgress runs 0..1 across the whole deck,
  // so stop i/(n-1) is exactly slide i fully in view; interpolating the
  // visible deck's colours over those stops yields the outgoing colour,
  // the incoming colour, or the exact blend between them mid-swipe. The
  // stops recompute whenever the deck grows or shrinks.
  const chromeColor = useTransform(
    scrollProgress,
    slideHex.map((_, i) => i / (slideHex.length - 1)),
    slideHex,
  )

  // The body paints behind the shell (overscroll and browser-chrome blend
  // areas); keep it on the same interpolated colour every scroll frame.
  useMotionValueEvent(chromeColor, 'change', (value) => {
    document.body.style.backgroundColor = value
  })
  useEffect(() => {
    document.body.style.backgroundColor = chromeColor.get()
  }, [chromeColor])

  // Sync URL path to slide index. Paths outside the visible deck fall back
  // to home: a gated deep link (/vault, /firstlook) lands on / unless the
  // wallet is a proven holder, and a stale path (e.g. the removed /watch)
  // does the same. While the holder state is still pending (session
  // restore or the balanceOf read) we wait rather than bounce a
  // possibly-valid gated deep link.
  useEffect(() => {
    const idx = slidePaths.indexOf(location.pathname)
    if (idx !== -1) {
      if (idx !== currentSlide) setCurrentSlide(idx)
      return
    }
    if (GATED_PATHS.includes(location.pathname) && (isPending || !graceOver)) return
    navigate('/', { replace: true })
    if (currentSlide !== 0) setCurrentSlide(0)
  }, [location.pathname, slidePaths, currentSlide, isPending, graceOver, navigate, setCurrentSlide])

  // Keep the browser's own chrome tint (theme-color meta) on the settled
  // slide's colour
  useEffect(() => {
    const hex = slideHex[currentSlide] ?? slideHex[0]
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex)
  }, [currentSlide, slideHex])

  const onSlideChange = useCallback((index: number) => {
    if (slidePaths[index]) navigate(slidePaths[index])
  }, [navigate, slidePaths])

  return (
    // h-app-shell declares 100vh before 100dvh, so older iOS gets a valid
    // height and newer browsers track the dynamic viewport as browser chrome
    // appears and disappears.
    // flex flex-col: progress bar, slide viewport and nav footer stack in flow.
    // The shell background paints through its safe-area padding, so the area
    // behind the status bar and landscape notch stays on the slide colour
    // while the header strip itself starts inside the safe area.
    // backgroundColor is the continuously interpolated chromeColor (no CSS
    // transition on it: framer already updates it every scroll frame, and a
    // transition would smear that behind the swipe).
    <motion.div
      className="h-app-shell w-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: chromeColor,
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
          {slides.map((slide) => (
            <div key={slide.path} className={`min-w-full h-full snap-start ${slide.shellClass}`}>
              {/* Per-slide Suspense: a lazily loaded slide (including the
                  gated pair appearing on holder connect) never blanks the
                  rest of the deck while its chunk loads. */}
              <Suspense fallback={<div className="h-full flex items-center justify-center text-white font-black">LOADING...</div>}>
                <div className={slide.innerClass}>{slide.content}</div>
              </Suspense>
            </div>
          ))}
        </div>
      </div>

      <NavigationDots
        totalSlides={slides.length}
        slideNames={slideNames}
        isSocials={slides[currentSlide]?.path === '/socials'}
        currentSlide={currentSlide}
        onSlideChange={onSlideChange}
      />
    </motion.div>
  )
}

function App() {
  return (
    <StoreProvider>
      <ThirdwebProvider>
        <HolderProvider>
          <Router>
            <AppContent />
          </Router>
        </HolderProvider>
      </ThirdwebProvider>
    </StoreProvider>
  )
}

export default App
