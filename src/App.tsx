import React, { Suspense, lazy, useEffect, useCallback, useMemo, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom'
import { ThirdwebProvider } from 'thirdweb/react'
import SiteHeader from './components/SiteHeader'
import DesktopScroll from './components/DesktopScroll'
import './index.css'

import { StoreProvider, useStore } from './hooks/useStore'
import { HolderProvider, useHolderStatus } from './hooks/useHolderStatus'
import { useSlideScroll } from './hooks/useSlideScroll'
import { useMediaQuery } from './hooks/useMediaQuery'
import { tintAt, tintStops } from './lib/tint'
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
const SlideFaq = lazy(() => import('./features/faq/SlideFaq'))

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

// Large desktop starts at 1280px (Tailwind xl). Phones and every
// standard tablet stay on the deck: tablets top out at 1180px CSS
// width in landscape (iPad Air), so only true laptop and desktop
// viewports get the vertical scroller and left rail. The one edge
// case is the 12.9-inch iPad Pro in landscape (1366px), which takes
// the scroller; on a screen that size it reads like a laptop page,
// and the scroller works with touch exactly as with a mouse.
const DESKTOP_QUERY = '(min-width: 1280px)'

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
      '/faq': <SlideFaq />,
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

  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  // The mobile deck owns its scroll progress; the desktop scroller
  // writes its own. Only the active layout's hook is enabled, so the
  // two can never fight over the same container.
  const { containerRef, scrollProgress } = useSlideScroll({
    slidePaths,
    currentSlide,
    isGalleryOpen,
    navigate,
    enabled: !isDesktop,
  })
  const desktopProgress = useMotionValue(0)

  // Uniform dissolve tint (see src/lib/tint.ts). One interpolated
  // value paints the full-viewport shell behind the content on BOTH
  // layouts, and the slide panels are transparent, so the main page
  // areas dissolve exactly like the header and footer chrome used to:
  // no solid panel colour ever cuts at a boundary. On mobile the
  // stops are index fractions i/(n-1), so at a settled slide the tint
  // is bit-exact that slide's hex and the settled look is unchanged
  // from before. On desktop the stops are the sections' activation
  // scroll positions (same hexes, same order), since sections have
  // unequal heights; outside each boundary's blend window the tint
  // sits exactly on the section in view's hex. The value is a motion
  // value, so every scroll frame repaints without re-rendering.
  // While the Genesis gallery overlay is open the tint is maroon, the
  // same rule the shell and theme-color already followed.
  const tint = useMotionValue(slideHex[0] ?? '#3C0010')
  const barProgress = useMotionValue(0)
  const progressWidth = useTransform(barProgress, [0, 1], ['0%', '100%'])
  const stops = useMemo(() => tintStops(slideHex.length), [slideHex.length])
  useEffect(() => {
    const source = isDesktop ? desktopProgress : scrollProgress
    const update = (v: number) => {
      barProgress.set(v)
      // Mobile owns the tint through index-fraction stops; on desktop
      // DesktopScroll owns it through section-anchored stops, so this
      // effect must not write it there or the two would fight.
      if (!isDesktop) tint.set(isGalleryOpen ? '#3C0010' : tintAt(stops, slideHex, v))
    }
    update(source.get())
    return source.on('change', update)
  }, [isDesktop, desktopProgress, scrollProgress, stops, slideHex, isGalleryOpen, barProgress, tint])

  // The body paints behind the shell (overscroll and browser-chrome blend
  // areas); keep it on the same interpolated colour every scroll frame.
  useMotionValueEvent(tint, 'change', (value) => {
    document.body.style.backgroundColor = value
  })
  useEffect(() => {
    document.body.style.backgroundColor = tint.get()
  }, [tint])

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
  // slide's colour. The body background now follows the interpolated
  // tint continuously (above), so it no longer snaps here. While the
  // Genesis gallery overlay is open, every layer goes maroon: the
  // overlay itself is maroon, but the body behind it (which shows
  // through a translucent Android nav bar at the viewport bottom) and
  // the shell tint would otherwise stay Genesis pink, leaving a pink
  // footer strip under a maroon view.
  useEffect(() => {
    const hex = isGalleryOpen ? '#3C0010' : (slideHex[currentSlide] ?? slideHex[0])
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex)
  }, [currentSlide, slideHex, isGalleryOpen])

  const onSlideChange = useCallback((index: number) => {
    if (slidePaths[index]) navigate(slidePaths[index])
  }, [navigate, slidePaths])

  // Desktop scrollspy: a scroll-driven section change only replaces the
  // URL, so the location effect can settle currentSlide without the
  // scroller scrolling back. Navigation-driven changes (rail clicks,
  // header menu, deep links) go through onSlideChange instead.
  const onScrollSection = useCallback(
    (index: number) => {
      if (slidePaths[index] && slidePaths[index] !== location.pathname) {
        navigate(slidePaths[index], { replace: true })
      }
    },
    [navigate, slidePaths, location.pathname],
  )

  return (
    // h-app-shell declares 100vh before 100dvh, so older iOS gets a valid
    // height and newer browsers track the dynamic viewport as browser chrome
    // appears and disappears.
    // flex flex-col: progress bar, slide viewport and nav footer stack in flow.
    // The shell background paints through its safe-area padding, so the area
    // behind the status bar and landscape notch stays on the slide colour
    // while the header strip itself starts inside the safe area.
    // backgroundColor is the continuously interpolated tint (no CSS
    // transition on it: framer already updates it every scroll frame, and a
    // transition would smear that behind the swipe). The shell is the
    // single full-viewport background layer on both layouts; the slide
    // panels and desktop sections are transparent, so the tint is the
    // page background everywhere and no boundary ever cuts.
    <motion.div
      className="h-app-shell w-full relative overflow-hidden"
      style={{
        // Maroon shell while the gallery overlay is open (see the
        // theme-color effect above); otherwise the interpolated tint.
        backgroundColor: isGalleryOpen ? '#3C0010' : tint,
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Layer order, back to front (Part 8): the shell tint; the slide
          viewport, full-bleed across the whole shell height so content
          scrolls OVER the tint; then the chrome (progress strip, the
          fixed header row, the nav dock on mobile) floating above content.
          The header and footer no longer exist as layout bands, so
          nothing clips content at a band boundary any more. */}
      <div className="absolute inset-0 overflow-hidden">
        {isDesktop ? (
          <DesktopScroll
            sections={slides}
            currentSlide={currentSlide}
            onSectionChange={onSlideChange}
            onScrollSection={onScrollSection}
            progress={desktopProgress}
            tint={tint}
            hexes={slideHex}
            galleryOpen={isGalleryOpen}
          />
        ) : (
          <div
            ref={containerRef}
            className="h-full w-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar"
          >
            {slides.map((slide) => (
              // Transparent panel: the shell tint behind it is the page
              // background, so swiping dissolves between slide colours
              // instead of cutting at the panel edge. shellClass stays
              // in the deck metadata (tests pin it) but no longer paints.
              <div
                key={slide.path}
                className="min-w-full h-full snap-start"
                // --slide-weight carries the slide's resolved font weight
                // (per-slide override, else sitewide) for its header copy;
                // the .slide-copy rule in index.css reads it. Unset when
                // there is no override, so the design's own weights rule.
                style={
                  slide.weight ? ({ '--slide-weight': slide.weight } as React.CSSProperties) : undefined
                }
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
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none">
        <motion.div className="h-full bg-ohnahji-gold" style={{ width: progressWidth }} />
      </div>

      {/* Slim sitewide header: logo, slide-index menu, key links, MINT,
          and wallet, in one row. Hidden while the genesis gallery
          overlay is open. See src/components/SiteHeader.tsx. */}
      <SiteHeader
        slideNames={slideNames}
        slidePaths={slidePaths}
        currentSlide={currentSlide}
        onSlideChange={onSlideChange}
        onHome={() => navigate('/')}
        onMint={() => navigate('/mint')}
        showMint={siteConfig.features.mintPill}
        isGalleryOpen={isGalleryOpen}
        client={client}
        chain={chain}
      />

      {/* The dock floats over the full-bleed viewport (Part 8). The
          wrapper and the component root pass clicks through; only the
          dock pill assembly itself takes them, so content scrolling
          beneath the transparent parts of the footer zone stays
          reachable and the dock never loses a tap to a card under it.
          Mobile and tablet only: on large desktop the left rail
          replaces the dock. */}
      {!isDesktop && (
        <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
          <NavigationDots
            totalSlides={slides.length}
            slideNames={slideNames}
            isSocials={slides[currentSlide]?.path === '/socials'}
            currentSlide={currentSlide}
            onSlideChange={onSlideChange}
          />
        </div>
      )}
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
