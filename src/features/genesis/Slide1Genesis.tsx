import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NFTGallery from '../../components/NFTGallery'
import { IPFS_CID_GENESIS } from '../../lib/constants'

const IMAGE_BASE = `https://${IPFS_CID_GENESIS}.ipfs.dweb.link`
const getNFTImage = (tokenId: number): string => `${IMAGE_BASE}/${tokenId}.png`

interface Slide1GenesisProps {
  totalSupply: number
  onGalleryOpen: (open: boolean) => void
}

const Slide1Genesis = ({ totalSupply, onGalleryOpen }: Slide1GenesisProps) => {
  const [showGallery, setShowGallery] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [previewIds, setPreviewIds] = useState<number[]>([])

  useEffect(() => {
    onGalleryOpen(showGallery)
  }, [showGallery, onGalleryOpen])

  useEffect(() => {
    const supply = totalSupply || 8888
    const ids = Array.from({ length: 9 }, () => Math.floor(Math.random() * supply) + 1)
    setPreviewIds(ids)
  }, [totalSupply])

  return (
    <div className="min-h-full flex flex-col justify-center py-8 relative">
      <div className={`${showGallery ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-5 md:gap-8 items-center">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            <div>
              <span className="dash-badge-gold mb-3">January 2022</span>
              <h1 className="text-4xl md:text-6xl font-black text-white leading-none mt-3">
                The<br />Genesis
              </h1>
              <p className="text-dash-muted text-sm md:text-base mt-3 max-w-sm leading-relaxed">
                MLK Weekend Launch. The beginning of something revolutionary in the NFT space.
              </p>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Supply', value: totalSupply > 0 ? totalSupply.toLocaleString() : '8,888' },
                { label: 'Launch', value: 'Jan 2022' },
                { label: 'Network', value: 'ETH' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-3 rounded-xl"
                  style={{ background: '#161616', border: '1px solid #2a2a2a' }}
                >
                  <div className="dash-label mb-1">{stat.label}</div>
                  <div className="text-white font-black text-lg leading-none">{stat.value}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowGallery(true)}
              className="dash-btn text-base font-bold w-fit px-8 py-3"
            >
              View Gallery →
            </button>
          </motion.div>

          {/* Right column — NFT grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative"
          >
            <div
              onClick={() => setShowGallery(true)}
              className="rounded-2xl overflow-hidden cursor-pointer group"
              style={{ background: '#161616', border: '1px solid #2a2a2a' }}
            >
              <div className="grid grid-cols-3 gap-[2px] bg-[#0a0a0a]">
                {previewIds.length > 0 ? previewIds.map((id, idx) => (
                  <div key={`${id}-${idx}`} className="overflow-hidden aspect-square bg-[#0a0a0a]">
                    <img
                      src={getNFTImage(id)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/150/FE517E/FFFFFF?text=${id}`
                      }}
                    />
                  </div>
                )) : (
                  <div className="col-span-3 row-span-3 aspect-square flex items-center justify-center bg-[#161616]">
                    <span className="text-4xl opacity-30">👑</span>
                  </div>
                )}
              </div>
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderTop: '1px solid #2a2a2a' }}
              >
                <span className="text-sm text-white font-semibold">Tap to Explore</span>
                <span className="text-ohnahji-pink text-sm font-bold">{totalSupply > 0 ? totalSupply.toLocaleString() : '8,888'} NFTs</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showGallery && (
          <div className="w-full h-full fixed inset-0 z-[100]" style={{ background: '#0D0D0D' }}>
            <button
              onClick={() => { setShowGallery(false); setRefreshKey(k => k + 1) }}
              className="fixed top-4 right-4 z-[110] px-4 py-2 text-sm font-bold rounded-lg transition-all"
              style={{ background: '#161616', border: '1px solid #2a2a2a', color: '#fff' }}
            >
              ← Back
            </button>
            <NFTGallery key={refreshKey} totalSupply={totalSupply} onClose={() => setShowGallery(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Slide1Genesis
