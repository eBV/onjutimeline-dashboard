import { useState, useEffect, useCallback } from 'react'
import NFTGalleryGrid from './NFTGalleryGrid'
import NFTDetailModal from './NFTDetailModal'

interface NFTGalleryProps {
  totalSupply: number
  onClose?: () => void
}

const REVEAL_BUFFER = 30

const NFTGallery = ({ totalSupply, onClose }: NFTGalleryProps) => {
  const [tokens, setTokens] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [heroTokenId, setHeroTokenId] = useState(1)
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchError, setSearchError] = useState('')

  const maxToken = (totalSupply || 8888) - REVEAL_BUFFER

  const navigateTo = useCallback((heroId: number) => {
    const supply = totalSupply || 8888
    setHeroTokenId(heroId)
    const PAGE = 60
    const half = PAGE / 2
    const start = Math.max(1, Math.min(heroId - half, supply - PAGE + 1))
    const ids: number[] = []
    for (let i = start; i <= Math.min(start + PAGE - 1, supply); i++) ids.push(i)
    setTokens(ids)
  }, [totalSupply])

  const shuffleHero = useCallback(() => {
    navigateTo(Math.floor(Math.random() * maxToken) + 1)
  }, [navigateTo, maxToken])

  const handleSearch = useCallback(() => {
    const num = parseInt(searchInput.trim(), 10)
    if (isNaN(num) || num < 1) {
      setSearchError('Enter a valid token number')
      return
    }
    if (num > maxToken) {
      setSearchError(`Max token is #${maxToken}`)
      return
    }
    setSearchError('')
    setSearchInput('')
    navigateTo(num)
  }, [searchInput, maxToken, navigateTo])

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
      {/* Controls — in-flow header so tap targets match visual position */}
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
          >
            <input
              type="number"
              min={1}
              max={maxToken}
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setSearchError('') }}
              placeholder={`#1–${maxToken}`}
              className="w-24 px-2 py-2 border-[4px] border-ohnahji-black rounded-full font-black text-xs text-center bg-ohnahji-white focus:outline-none focus:border-ohnahji-gold shadow-neo-sm"
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
      </div>

      {/* Grid fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <NFTGalleryGrid tokens={tokens} heroTokenId={heroTokenId} onSelectToken={setSelectedTokenId} />
      </div>

      <NFTDetailModal tokenId={selectedTokenId} onClose={() => setSelectedTokenId(null)} />
    </div>
  )
}

export default NFTGallery
