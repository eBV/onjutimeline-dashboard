import { Fragment } from 'react'
import { useSlideSettings, copyLines } from '../../lib/siteConfig'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NFTGallery from '../../components/NFTGallery'
import { IPFS_CID_GENESIS } from '../../lib/constants'
import ResilientImage from '../../components/ResilientImage'
import ContractChip from '../../components/ContractChip'


interface Slide1GenesisProps {
  totalSupply: number
  onGalleryOpen: (open: boolean) => void
}

const Slide1Genesis = ({ totalSupply, onGalleryOpen }: Slide1GenesisProps) => {
  const { copy, weight } = useSlideSettings('/genesis')
  const copyClass = weight ? ' slide-copy' : ''
  const [showGallery, setShowGallery] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [previewIds, setPreviewIds] = useState<number[]>([])

  useEffect(() => {
    onGalleryOpen(showGallery)
  }, [showGallery, onGalleryOpen])

  useEffect(() => {
    // totalSupply comes from the store as a positive, live (or last-known)
    // value; never substitute a synthetic collection size here.
    const supply = Math.max(1, totalSupply)
    const ids = Array.from({ length: 9 }, () => Math.floor(Math.random() * supply) + 1)
    setPreviewIds(ids)
  }, [totalSupply])

  return (
    <div className="min-h-full flex flex-col items-center justify-start md:justify-center relative pt-20 pb-8 md:py-8">
      <div className={`${showGallery ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-6 md:gap-12 items-center mb-4 mt-4 md:mb-16 md:mt-16">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-block bg-ohnahji-gold text-ohnahji-black px-6 py-2 border-[6px] border-ohnahji-black rounded-3xl">
              <span className="text-sm font-bold">JANUARY 2022</span>
            </div>
            <h1 className={`text-6xl md:text-8xl font-black text-ohnahji-white leading-none${copyClass}`}>
              {copyLines(copy.heading).map((line, i) => (
                <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>
              ))}
            </h1>
            <p className={`text-xl text-ohnahji-white font-medium max-w-md leading-relaxed${copyClass}`}>
              {copy.paragraph}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowGallery(true)}
                className="neo-button-flood neo-button px-10 py-5 text-2xl font-black rounded-2xl instant-fill"
              >
                VIEW GALLERY
              </button>
            </div>
            <div>
              <p className="font-black text-ohnahji-white text-xs uppercase tracking-widest mb-2">Official contract</p>
              <ContractChip />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div
              onClick={() => setShowGallery(true)}
              className="neo-card p-6 bg-ohnahji-white rounded-[3rem] cursor-pointer hover:scale-105 transition-transform !rounded-[48px] group"
            >
              <div className="aspect-square bg-ohnahji-black border-[6px] border-ohnahji-black rounded-[2.5rem] flex items-center justify-center overflow-hidden relative transform-gpu">
                <div className="grid grid-cols-3 w-full h-full gap-[6px] bg-ohnahji-black p-0">
                  {previewIds.length > 0 ? previewIds.map((id, idx) => (
                    <div key={`${id}-${idx}`} className="overflow-hidden bg-ohnahji-burgundy relative shadow-inner">
                      <ResilientImage
                        cid={IPFS_CID_GENESIS}
                        path={`${id}.png`}
                        className="w-full h-full object-cover transform scale-[1.3] transition-transform duration-700 group-hover:scale-[1.5] will-change-transform"
                        alt=""
                        placeholderText={`${id}`}
                      />
                    </div>
                  )) : (
                    <div className="col-span-3 row-span-3 flex items-center justify-center bg-gradient-to-br from-ohnahji-pink to-ohnahji-burgundy">
                      <span className="text-4xl animate-pulse">👑</span>
                    </div>
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-ohnahji-black/80 backdrop-blur-sm p-4 border-t-4 border-ohnahji-black flex flex-col items-center">
                  <h3 className="text-xl text-ohnahji-white font-black">Tap to Explore</h3>
                  <p className="text-ohnahji-gold font-black text-sm">{totalSupply.toLocaleString()} NFTs minted</p>
                </div>
              </div>
            </div>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-6 -right-6 w-24 h-24 bg-ohnahji-gold border-[6px] border-ohnahji-black shadow-neo rounded-3xl flex items-center justify-center"
            >
              <img src="/ji.png" alt="Ji Icon" className="w-16 h-16 object-contain" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showGallery && (
          <div
            className="w-full h-full fixed inset-0 z-[100] bg-ohnahji-burgundy"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <button
              onClick={() => { setShowGallery(false); setRefreshKey(k => k + 1) }}
              className="fixed top-20 right-4 z-[110] bg-ohnahji-gold text-ohnahji-black px-4 py-2 border-[6px] border-ohnahji-black shadow-neo rounded-xl font-black hover:scale-105 transition-transform"
              style={{
                top: 'calc(5rem + env(safe-area-inset-top))',
                right: 'calc(1rem + env(safe-area-inset-right))',
              }}
            >
              ← BACK
            </button>
            <NFTGallery key={refreshKey} totalSupply={totalSupply} onClose={() => setShowGallery(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Slide1Genesis
