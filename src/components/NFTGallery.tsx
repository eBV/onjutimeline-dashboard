import { useState, useEffect, useCallback } from 'react'
import NFTGalleryGrid from './NFTGalleryGrid'
import NFTDetailModal from './NFTDetailModal'

interface NFTGalleryProps {
  totalSupply: number
  onClose?: () => void
}

// Intentional protection: the last 30 tokens of the on-chain supply stay
// out of the gallery until their art is revealed. The supply figure shown
// around the site is the full on-chain totalSupply (e.g. 5,097), so the
// searchable gallery range is honestly labelled #1 to supply minus this
// buffer (e.g. 5,067) instead of silently disagreeing with it.
const REVEAL_BUFFER = 30

const NFTGallery = ({ totalSupply, onClose }: NFTGalleryProps) => {
  const [tokens, setTokens] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [heroTokenId, setHeroTokenId] = useState(1)
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)
  const [selectedUnrevealed, setSelectedUnrevealed] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchError, setSearchError] = useState('')

  const supply = Math.max(0, totalSupply)
  const maxToken = Math.max(1, supply - REVEAL_BUFFER)

  const navigateTo = useCallback((heroId: number) => {
    // Page window stays inside the revealed range so browsing can never
    // surface the protected tail tokens the search cap excludes.
    const cap = Math.max(1, supply - REVEAL_BUFFER)
    setHeroTokenId(heroId)
    const PAGE = 60
    const half = PAGE / 2
    const start = Math.max(1, Math.min(heroId - half, cap - PAGE + 1))
    const ids: number[] = []
    for (let i = start; i <= Math.min(start + PAGE - 1, cap); i++) ids.push(i)
    setTokens(ids)
  }, [supply])

  const shuffleHero = useCallback(() => {
    navigateTo(Math.floor(Math.random() * maxToken) + 1)
  }, [navigateTo, maxToken])

  // Search covers the whole minted supply, not just the revealed range.
  // Tokens in the unrevealed band (maxToken, supply] are valid lookups:
  // they open the detail view in its unrevealed state. Only ids past the
  // live supply are an error, and all feedback is inline and site-styled;
  // the input is a text field so no native validation bubble can appear.
  const handleSearch = useCallback(() => {
    const raw = searchInput.trim()
    if (!/^\d+$/.test(raw)) {
      setSearchError(`Enter a token number between 1 and ${supply.toLocaleString()}`)
      return
    }
    const num = parseInt(raw, 10)
    if (num < 1) {
      setSearchError(`Enter a token number between 1 and ${supply.toLocaleString()}`)
      return
    }
    if (num > supply) {
      setSearchError(`That token does not exist yet; ${supply.toLocaleString()} minted so far`)
      return
    }
    setSearchError('')
    setSearchInput('')
    if (num > maxToken) {
      setSelectedUnrevealed(true)
      setSelectedTokenId(num)
      return
    }
    setSelectedUnrevealed(false)
    navigateTo(num)
    setSelectedTokenId(num)
  }, [searchInput, supply, maxToken, navigateTo])

  useEffect(() => {
    shuffleHero()
    setLoading(false)
  }, [shuffleHero])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (selectedTokenId !== null) setSelectedTokenId(null)
      else onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, selectedTokenId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-label="Loading gallery">
        <div className="text-ohnahji-white text-2xl font-black animate-pulse font-sans">
          LOADING NFT GALLERY...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-ohnahji-burgundy flex flex-col font-sans">
      {/* Controls; in-flow header so tap targets match visual position */}
      <div className="flex-shrink-0 pt-20 pb-2 flex flex-col items-center gap-2 z-50">
        <div className="bg-ohnahji-black text-ohnahji-gold px-6 py-2 border-[6px] border-ohnahji-gold rounded-2xl shadow-neo">
          <span className="font-bold text-sm tracking-tighter">VIEWING: OHNAHJI #{heroTokenId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={shuffleHero}
            className="bg-ohnahji-white text-ohnahji-black px-4 py-2 border-[6px] border-ohnahji-black rounded-full font-black text-xs hover:bg-ohnahji-pink hover:text-white transition-all shadow-neo-sm active:translate-y-1"
          >
            SHUFFLE ART
          </button>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch() }}
            className="flex items-center gap-1"
            noValidate
          >
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setSearchError('') }}
              placeholder={`Search #1–${supply.toLocaleString()}`}
              aria-label="Search by token number"
              className="w-32 px-2 py-2 border-[4px] border-ohnahji-black rounded-full font-black text-xs text-center bg-ohnahji-white focus:outline-none focus:border-ohnahji-gold shadow-neo-sm"
            />
            <button
              type="submit"
              className="bg-ohnahji-gold text-ohnahji-black px-3 py-2 border-[4px] border-ohnahji-black rounded-full font-black text-xs hover:bg-ohnahji-pink hover:text-white transition-all shadow-neo-sm active:translate-y-1"
            >
              GO
            </button>
          </form>
        </div>
        {searchError && (
          <span className="text-ohnahji-gold font-black text-[10px] bg-ohnahji-black px-3 py-1 rounded-full border-2 border-ohnahji-gold">
            {searchError}
          </span>
        )}
        <span className="text-ohnahji-white/50 font-bold text-[10px] tracking-wide">
          REVEALED ART #1–{maxToken.toLocaleString()} OF {supply.toLocaleString()} MINTED; FINAL {REVEAL_BUFFER} STAY HIDDEN UNTIL REVEAL
        </span>
      </div>

      {/* Grid fills remaining space. The grid only ever holds revealed
          tokens; grid clicks are always revealed selections. */}
      <div className="flex-1 overflow-hidden">
        <NFTGalleryGrid
          tokens={tokens}
          heroTokenId={heroTokenId}
          onSelectToken={(id) => { setSelectedUnrevealed(false); setSelectedTokenId(id) }}
        />
      </div>
      <NFTDetailModal
        tokenId={selectedTokenId}
        unrevealed={selectedUnrevealed}
        onClose={() => setSelectedTokenId(null)}
      />
    </div>
  )
}

export default NFTGallery
