import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ConnectButton, useActiveAccount, useConnectModal, useWalletDetailsModal } from 'thirdweb/react'
import { OHNAHJI_WALLET_THEME } from '../lib/walletTheme'

// Header motion language matches the tray: S-curve easeInOut over
// 0.35s, so every header move feels like the same system.
const HEADER_TRANSITION = { duration: 0.35, ease: 'easeInOut' as const }

// Mobile means below Tailwind's md breakpoint (768px): the wallet
// control is an icon there and the full CONNECT pill from md up. This
// is JS-driven (not CSS display toggling) on purpose: rendering one
// control or the other lets the shared layoutId morph animate the
// icon into the pill and back when the viewport crosses the breakpoint,
// instead of a hard cut. Same for the sibling glide: motion layout
// props let MENU and the other header items slide to their new spots
// when the wallet control changes size, instead of jumping.
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 767px)').matches,
  )
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

// Slim sitewide header: one row that consolidates what used to float
// separately (the MINT pill and the wallet button) plus the ji logo
// home button and, below desktop sizes, a slide-index menu for jumping.
// The bottom dock stays the primary nav on phones and tablets, and
// the left bar on desktop; this header deliberately does NOT
// duplicate the full slide list as links. Desktop shows the FAQ link
// and no MENU button, since the left bar's hover menu replaces it;
// mobile keeps the ji logo, a wallet-icon-only button, and MENU at the
// far right, with Mint reachable from the menu. The row is transparent,
// not a solid band, so no existing slide needs new top spacing: slide
// content already clears this strip. Motion: the wallet control morphs
// between icon and pill on the md breakpoint (wrapper width/height
// animation plus content crossfade under overflow-hidden), header
// items glide when the control changes size (layout props), and the
// slide-index panel slides and fades in and out.
const CONNECT_BUTTON_CLASS = '!bg-ohnahji-gold !text-ohnahji-black !border-[4px] !border-ohnahji-black !rounded-xl !font-black !text-xs !px-3 !py-1.5 !h-auto !shadow-neo-sm !border-solid hover:!shadow-none hover:!translate-x-[2px] hover:!translate-y-[2px] !transition-all'

interface SiteHeaderProps {
  slideNames: string[]
  slidePaths: string[]
  currentSlide: number
  onSlideChange: (index: number) => void
  onHome: () => void
  onMint: () => void
  showMint: boolean
  isGalleryOpen: boolean
  client: any
  chain: any
}

const SiteHeader = ({
  slideNames,
  slidePaths,
  currentSlide,
  onSlideChange,
  onHome,
  onMint,
  showMint,
  isGalleryOpen,
  client,
  chain,
}: SiteHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const account = useActiveAccount()
  const { connect } = useConnectModal()
  const detailsModal = useWalletDetailsModal()
  const isMobile = useIsMobile()
  if (isGalleryOpen) return null

  const handleWalletIcon = () => {
    if (account) {
      detailsModal.open({ client, chains: chain ? [chain] : [], theme: OHNAHJI_WALLET_THEME })
    } else {
      connect({ client, chain, theme: OHNAHJI_WALLET_THEME })
    }
  }

  const keyLinks = [{ label: 'FAQ', path: '/faq' }]

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[90] flex items-start justify-between gap-2 px-3"
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
          paddingLeft: 'calc(0.75rem + env(safe-area-inset-left))',
          paddingRight: 'calc(0.75rem + env(safe-area-inset-right))',
        }}
      >
        <div className="flex items-start gap-2">
          <motion.button
            type="button"
            layout
            transition={HEADER_TRANSITION}
            onClick={onHome}
            aria-label="Go home"
            className="hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <img src="/ji.png" alt="" aria-hidden="true" className="h-[65px] w-auto" />
          </motion.button>
        </div>

        {/* Center-aligned, not top-aligned: the morph wrapper is taller
            than its siblings (50px on mobile: 40px icon plus the 5px
            shadow padding), so top alignment left the wallet icon's
            center 6px below MENU's. Centering puts the icon, the pill,
            and the FAQ/MINT buttons on one shared middle line. */}
        <div className="flex items-center gap-2">
          <motion.div layout transition={HEADER_TRANSITION} className="hidden md:flex items-start gap-2">
            {keyLinks.map((link) => {
              const idx = slidePaths.indexOf(link.path)
              if (idx === -1) return null
              return (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => onSlideChange(idx)}
                  className="bg-ohnahji-white text-ohnahji-burgundy border-[3px] border-ohnahji-black rounded-xl font-black text-xs px-3 py-2 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  {link.label}
                </button>
              )
            })}
            {showMint && (
              <button
                onClick={onMint}
                aria-label="Go to the mint slide"
                className="bg-ohnahji-pink text-ohnahji-white border-[4px] border-ohnahji-black rounded-xl font-black text-xs px-3 py-2 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                MINT
              </button>
            )}
          </motion.div>
          {/* One wallet control, two shapes, one morphing wrapper:
              on mobile it is just the icon, from md up it is the full
              CONNECT pill. Crossing the breakpoint animates the
              wrapper's width and height (icon 50px to the pill's
              natural size, and back) while the two contents crossfade
              under overflow-hidden, so the pill visibly grows out of
              the icon instead of cutting. The layoutId shared-element
              route was tried first and did not animate here: a
              viewport resize cancels the projection transition, so
              this explicit size-plus-fade morph is what actually
              moves. Tapping the icon opens the same connect modal
              when disconnected or the same account details modal
              when connected. The wrapper carries 5px of padding
              because the controls' neo shadows (4px down-right
              offsets) would otherwise be clipped by its
              overflow-hidden on the right and bottom edges; the
              icon state's 50px is the 40px button plus that padding
              on both sides. */}
          <motion.div
            animate={{ width: isMobile ? 50 : 'auto', height: isMobile ? 50 : 'auto' }}
            transition={HEADER_TRANSITION}
            className="relative overflow-hidden shrink-0 p-[5px]"
          >
            <motion.div
              animate={{ opacity: isMobile ? 1 : 0 }}
              transition={HEADER_TRANSITION}
              style={{ pointerEvents: isMobile ? 'auto' : 'none' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <button
                type="button"
                onClick={handleWalletIcon}
                aria-label={account ? 'Open wallet details' : 'Connect wallet'}
                className="relative bg-ohnahji-gold text-ohnahji-black border-[3px] border-ohnahji-black rounded-xl w-10 h-10 flex items-center justify-center shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
                {account && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-ohnahji-white border-2 border-ohnahji-black" aria-hidden="true" />
                )}
              </button>
            </motion.div>
            <motion.div
              animate={{ opacity: isMobile ? 0 : 1 }}
              transition={HEADER_TRANSITION}
              style={{ pointerEvents: isMobile ? 'none' : 'auto' }}
            >
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
            </motion.div>
          </motion.div>
          {/* The slide-index MENU button sits at the far right, outside
              the wallet control. It is hidden on desktop (xl and up),
              where the left bar's hover menu replaces it; phones and
              tablets have no left bar, so they keep it. Its layout
              prop glides it to its new spot when the wallet control
              morphs and changes width, instead of jumping. */}
          <motion.button
            type="button"
            layout
            transition={HEADER_TRANSITION}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Open the slide index"
            className="xl:hidden bg-ohnahji-white text-ohnahji-burgundy border-[3px] border-ohnahji-black rounded-xl font-black text-xs px-3 py-2 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {menuOpen ? 'CLOSE' : 'MENU'}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={HEADER_TRANSITION}
              aria-label="Close the slide index"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[91] bg-transparent"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={HEADER_TRANSITION}
              className="fixed top-16 right-3 z-[92] w-56 bg-ohnahji-white border-[4px] border-ohnahji-black rounded-2xl shadow-neo p-2 max-h-[70dvh] overflow-y-auto origin-top-right"
            >
              {slidePaths.map((path, i) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => {
                    onSlideChange(i)
                    setMenuOpen(false)
                  }}
                  className={`w-full text-left font-black text-sm px-3 py-2 rounded-xl ${
                    i === currentSlide ? 'bg-ohnahji-pink text-ohnahji-white' : 'text-ohnahji-burgundy hover:bg-ohnahji-gold/30'
                  }`}
                >
                  {slideNames[i] ?? path}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default SiteHeader
