import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNFTMetadata } from '../hooks/useNFT'
import { CONTRACT_ADDRESS, getNFTImage } from '../lib/constants'

interface NFTDetailModalProps {
  tokenId: number | null
  onClose: () => void
}

const NFTDetailModal = ({ tokenId, onClose }: NFTDetailModalProps) => {
  const { data: selectedMeta, isLoading: metaLoading } = useNFTMetadata(tokenId)
  const [bgColor, setBgColor] = useState<string | null>(null)

  useEffect(() => { setBgColor(null) }, [tokenId])

  const sampleColor = useCallback((img: HTMLImageElement) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 4
      canvas.height = 4
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, 4, 4)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      setBgColor(`rgb(${r},${g},${b})`)
    } catch {
      // CORS blocked — keep default white
    }
  }, [])

  return (
    <AnimatePresence>
      {tokenId !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-start md:items-center justify-center p-3 md:p-6 bg-ohnahji-black/95 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <div
            className="max-w-6xl w-full flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-center my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Art frame — no white border, art edge-to-edge */}
            <motion.div
              initial={{ scale: 0.9, x: -20, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              exit={{ scale: 0.9, x: -20, opacity: 0 }}
              className="w-full md:w-1/2 h-64 md:h-auto md:aspect-square relative rounded-[2.5rem] overflow-hidden shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]"
            >
              <img
                crossOrigin="anonymous"
                src={getNFTImage(tokenId)}
                className="w-full h-full object-cover"
                alt={`Ohnahji #${tokenId}`}
                onLoad={(e) => sampleColor(e.currentTarget)}
              />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-ohnahji-gold text-ohnahji-black w-12 h-12 rounded-full flex items-center justify-center border-[6px] border-ohnahji-black shadow-neo-sm hover:scale-110 transition-transform font-black text-xl"
                aria-label="Close detail view"
              >
                ✕
              </button>
            </motion.div>

            {/* Traits frame — background matches token art color */}
            <motion.div
              initial={{ scale: 0.9, x: 20, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              exit={{ scale: 0.9, x: 20, opacity: 0 }}
              className="neo-card p-8 rounded-[2.5rem] w-full md:w-1/2 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6"
              style={{ backgroundColor: bgColor ?? '#FFFFFF', transition: 'background-color 0.4s ease' }}
            >
              <div>
                <h2 className="text-5xl font-black text-ohnahji-burgundy tracking-tighter">
                  Ohnahji #{tokenId}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-ohnahji-gold text-ohnahji-black px-3 py-1 rounded-full border-2 border-ohnahji-black text-xs font-black uppercase">
                    Genesis
                  </span>
                  <span className="text-ohnahji-burgundy/40 font-bold uppercase text-xs tracking-widest">
                    Collection
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-[6px] border-ohnahji-black pb-2">
                  <h3 className="text-2xl font-black">TRAITS</h3>
                  <span className="text-[10px] font-bold text-ohnahji-burgundy/60 italic">
                    Click trait to filter on OpenSea
                  </span>
                </div>

                {metaLoading ? (
                  <div className="grid grid-cols-2 gap-3 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-14 bg-ohnahji-pink/10 rounded-xl border-2 border-ohnahji-pink/20" />
                    ))}
                  </div>
                ) : selectedMeta?.attributes ? (
                  <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedMeta.attributes.map((attr: { trait_type: string; value: string }, i: number) => {
                      const filterUrl = `https://opensea.io/collection/ohnahji?search[stringTraits][0][name]=${encodeURIComponent(attr.trait_type)}&search[stringTraits][0][values][0]=${encodeURIComponent(attr.value)}`
                      return (
                        <a
                          key={i}
                          href={filterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neo-button-pink !p-3 !rounded-xl !border-[6px] !flex !flex-col !items-start !text-left hover:!translate-x-0 hover:!translate-y-[-2px] !shadow-neo-sm hover:!shadow-neo transition-all"
                          aria-label={`Trait ${attr.trait_type}: ${attr.value}`}
                        >
                          <span className="text-[9px] font-black uppercase opacity-60 leading-tight">
                            {attr.trait_type}
                          </span>
                          <span className="font-black text-xs truncate w-full">{attr.value}</span>
                        </a>
                      )
                    })}
                    <a
                      href={`https://opensea.io/assets/ethereum/${CONTRACT_ADDRESS}/${tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="col-span-2 neo-button !py-4 text-center font-black text-xl flex items-center justify-center gap-2 mt-2"
                    >
                      VIEW ON OPENSEA <span className="text-sm">↗</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-ohnahji-burgundy/40 italic">No traits found or metadata offline.</p>
                )}
              </div>

              <button
                onClick={onClose}
                className="text-[10px] font-black uppercase text-ohnahji-burgundy/40 hover:text-ohnahji-pink transition-colors tracking-widest text-center"
              >
                Close Detail View
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NFTDetailModal
