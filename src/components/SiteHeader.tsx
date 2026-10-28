import { useState } from 'react'
import { ConnectButton } from 'thirdweb/react'
import { OHNAHJI_WALLET_THEME } from '../lib/walletTheme'

// Slim sitewide header: one row that consolidates what used to float
// separately (the MINT pill and the wallet button) plus a pink HOME
// button and, below desktop sizes, a slide-index menu for jumping.
// The bottom dock stays the primary nav on phones and tablets, and
// the left bar on desktop; this header deliberately does NOT
// duplicate the full slide list as links. Desktop shows the FAQ link
// and no MENU button, since the left bar's hover menu replaces it;
// mobile keeps HOME, menu, and Connect, with Mint reachable from the
// menu. The row is transparent, not a solid band, so no existing
// slide needs new top spacing: slide content already clears this strip.
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
  if (isGalleryOpen) return null

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
          <button
            type="button"
            onClick={onHome}
            aria-label="Go home"
            className="bg-ohnahji-pink text-ohnahji-white border-[3px] border-ohnahji-black rounded-xl font-black text-sm px-3 py-1.5 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            HOME
          </button>
          {/* The slide-index MENU button is hidden on desktop (xl and
              up), where the left bar's hover menu replaces it; phones
              and tablets have no left bar, so they keep it. */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Open the slide index"
            className="xl:hidden bg-ohnahji-white text-ohnahji-burgundy border-[3px] border-ohnahji-black rounded-xl font-black text-xs px-3 py-2 shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {menuOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>

        <div className="flex items-start gap-2">
          <div className="hidden md:flex items-start gap-2">
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
          </div>
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
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close the slide index"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[91] bg-transparent"
          />
          <div className="fixed top-16 right-3 z-[92] w-56 bg-ohnahji-white border-[4px] border-ohnahji-black rounded-2xl shadow-neo p-2 max-h-[70dvh] overflow-y-auto">
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
          </div>
        </>
      )}
    </>
  )
}

export default SiteHeader
