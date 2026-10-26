import React, { Suspense, lazy, useEffect, useCallback, useMemo, useState } from 'react'
import { motion, useTransform, useMotionValueEvent } from 'framer-motion'
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom'
import { ThirdwebProvider, ConnectButton } from 'thirdweb/react'
import { OHNAHJI_WALLET_THEME } from './lib/walletTheme'
import './index.css'

import { StoreProvider, useStore } from './hooks/useStore'
import { HolderProvider, useHolderStatus } from './hooks/useHolderStatus'
import { useSlideScroll } from './hooks/useSlideScroll'
import NavigationDots from './components/NavigationDots'
import { initAutoHideScrollbars } from './lib/autoHideScrollbars'
import { visibleSlides, gateSatisfied, SlideMeta } from './lib/deck'
import { useSiteConfig, DEFAULT_SITE_CONFIG } from './lib/siteConfig'
import { isAdminAddress, ADMIN_PATH } from './lib/admin'

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
const SlideExchangent = lazy(() => import('./features/exchangent/SlideExchangent'))
const SlideAdmin = lazy(() => import('./features/admin/SlideAdmin'))
const SlideMuralith = lazy(() => import('./features/muralith/SlideMuralith'))

// Shared inner-wrapper class for non-hero slides:
// px-10 md:px-16 gives doubled gutters vs. the old px-5 on mobile and generous
// breathing room on wide desktop screens.
// No justify; each slide's own outer div uses min-h-full + justify-center so
// content centers when it fits and scrolls from the top when it overflows.
const SLIDE_INNER = 'h-full overflow-y-auto flex flex-col px-10 md:px-16 slide-scroller'
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
  const { isHolder, isConnected, isPending, address } = useHolderStatus()

  // The owner's live site config (slide visibility, background colours,
  // feature switches). Until it lands, and if it ever fails, the code
  // defaults apply, so the deck below is always well-formed.
  const { data: siteConfigData } = useSiteConfig()
  const siteConfig = siteConfigData ?? DEFAULT_SITE_CONFIG
  // The ADMIN slide exists only for the owner's wallet. The address
  // check is instant once a wallet connects; the config API re-checks
  // server-side, so this only controls visibility, never access.
  const isAdmin = isAdminAddress(address)

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
      '/muralith': <SlideMuralith />,
      '/exchangent': <SlideExchangent />,
      '/vault': <SlideVaultLocker />,
      '/firstlook': <SlideFirstLook />,
      '/admin': <SlideAdmin />,
    }
    return visibleSlides(
      { isConnected, isHolder },
      { isAdmin, slideConfig: siteConfig.slides, order: siteConfig.order, fontWeight: siteConfig.fontWeight },
    ).map((meta) => ({
      ...meta,
      innerClass: meta.path === '/' ? HERO_INNER : SLIDE_INNER,
      content: contentByPath[meta.path],
    }))
  }, [isHolder, isConnected, isAdmin, siteConfig, totalSupply, setIsGalleryOpen])

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

  // Sitewide auto-hiding scrollbars (see src/lib/autoHideScrollbars.ts):
  // bars dissolve out after scrolling stops, so a persistent bar never
  // sits on screen while reading.
  useEffect(() => initAutoHideScrollbars(), [])

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
    // The ADMIN slide joins the deck the moment the owner's address is
    // known, which is BEFORE the holder balance resolves; if the gated
    // pair then appends ahead of it, /admin's index shifts mid-load and
    // the scroll handler can hijack the navigation to whatever slide
    // lands on the old index (a cold /admin load parking on /vault).
    // Like a gated deep link, an /admin load waits for the holder state
    // to settle so the deck is final before its index is resolved.
    if (location.pathname === ADMIN_PATH && isPending) return
    const idx = slidePaths.indexOf(location.pathname)
    if (idx !== -1) {
      if (idx !== currentSlide) setCurrentSlide(idx)
      return
    }
    // A path outside the visible deck bounces home, except a gated
    // path whose gate is merely unresolved: while the wallet session
    // is restoring or the balance is reading, wait rather than bounce
    // a possibly-valid deep link (the same grace the old gated pair
    // got). A hidden (visible=false) slide bounces at once.
    const cfgEntry = siteConfig.slides[location.pathname]
    const gatedUnsatisfied =
      location.pathname === ADMIN_PATH ||
      (cfgEntry !== undefined &&
        cfgEntry.gate !== 'public' &&
        !gateSatisfied(cfgEntry.gate, { isConnected, isHolder }))
    if (gatedUnsatisfied && (isPending || !graceOver)) return
    navigate('/', { replace: true })
    if (currentSlide !== 0) setCurrentSlide(0)
  }, [location.pathname, slidePaths, currentSlide, isPending, graceOver, navigate, setCurrentSlide, siteConfig, isConnected, isHolder])

  // Keep the browser's own chrome tint (theme-color meta) on the settled
  // slide's colour. The body background is set here too as a backstop
  // (Part 5): on an index change it snaps to the active slide's hex, so
  // the paint behind the shell can never sit on the default white while
  // the interpolated tint catches up after a deck change. While the
  // Genesis gallery overlay is open, every layer goes maroon: the
  // overlay itself is maroon, but the body behind it (which shows
  // through a translucent Android nav bar at the viewport bottom) and
  // the shell tint would otherwise stay Genesis pink, leaving a pink
  // footer strip under a maroon view.
  useEffect(() => {
    const hex = isGalleryOpen ? '#3C0010' : (slideHex[currentSlide] ?? slideHex[0])
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex)
    if (hex) document.body.style.backgroundColor = hex
  }, [currentSlide, slideHex, isGalleryOpen])

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
      className="h-app-shell w-full relative overflow-hidden"
      style={{
        // Maroon shell while the gallery overlay is open (see the
        // theme-color effect above); otherwise the interpolated tint.
        backgroundColor: isGalleryOpen ? '#3C0010' : chromeColor,
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Layer order, back to front (Part 8): the shell tint; the slide
          viewport, full-bleed across the whole shell height so content
          scrolls OVER the tint; then the chrome (progress strip, the
          fixed MINT/wallet row, the nav dock) floating above content.
          The header and footer no longer exist as layout bands, so
          nothing clips content at a band boundary any more. */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={containerRef}
          className="h-full w-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar"
        >
          {slides.map((slide) => (
            // The inline background is the slide's effective hex (the
            // site-config override when one is set, the deck default
            // otherwise). It paints the same colour the shellClass names,
            // and wins over it when an override differs, so the slide's
            // full-bleed background always matches the chrome tint.
            <div
              key={slide.path}
              className={`min-w-full h-full snap-start ${slide.shellClass}`}
              // --slide-weight carries the slide's resolved font weight
              // (per-slide override, else sitewide) for its header copy;
              // the .slide-copy rule in index.css reads it. Unset when
              // there is no override, so the design's own weights rule.
              style={{
                backgroundColor: slide.hex,
                ...(slide.weight ? { '--slide-weight': slide.weight } : {}),
              } as React.CSSProperties}
            >
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

      <div className="absolute top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none">
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
          {siteConfig.features.mintPill && (
            <button
              onClick={() => navigate('/mint')}
              className="bg-ohnahji-pink text-ohnahji-white border-[4px] border-ohnahji-black rounded-xl font-black text-xs px-3 py-2 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              aria-label="Go to the mint slide"
            >
              MINT
            </button>
          )}
          <ConnectButton
            client={client}
            chain={chain}
            theme={OHNAHJI_WALLET_THEME}
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

      {/* The dock floats over the full-bleed viewport (Part 8). The
          wrapper and the component root pass clicks through; only the
          dock pill assembly itself takes them, so content scrolling
          beneath the transparent parts of the footer zone stays
          reachable and the dock never loses a tap to a card under it. */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
        <NavigationDots
          totalSlides={slides.length}
          slideNames={slideNames}
          isSocials={slides[currentSlide]?.path === '/socials'}
          currentSlide={currentSlide}
          onSlideChange={onSlideChange}
        />
      </div>
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
