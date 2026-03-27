import { motion } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { GATEWAYS, getNFTImage } from '../lib/constants'
import { useIsMobile } from '../hooks/use-mobile'

interface NFTGalleryGridProps {
  tokens: number[]
  heroTokenId: number
  onSelectToken: (id: number) => void
}

const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  id: number,
  gatewayIndex: number
) => {
  const img = e.target as HTMLImageElement
  if (gatewayIndex + 1 < GATEWAYS.length) {
    img.src = `${GATEWAYS[gatewayIndex + 1]}/${id}.png`
    img.dataset.gatewayIndex = (gatewayIndex + 1).toString()
  } else {
    img.src = `https://via.placeholder.com/400/FE517E/FFFFFF?text=OHNAHJI+%23${id}`
  }
}

const NFTCard = ({
  id,
  heroTokenId,
  onSelectToken,
}: {
  id: number
  heroTokenId: number
  onSelectToken: (id: number) => void
}) => (
  <motion.div
    key={id}
    onClick={() => onSelectToken(id)}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: id === heroTokenId ? 1.05 : 1 }}
    whileHover={{ scale: id === heroTokenId ? 1.1 : 1.05, zIndex: 10 }}
    className={`group relative aspect-square overflow-hidden border-[2px] border-ohnahji-black rounded-xl cursor-pointer transition-shadow ${
      id === heroTokenId ? 'ring-[2px] ring-ohnahji-gold z-10' : ''
    }`}
  >
    <img
      src={getNFTImage(id)}
      alt={`Ohnahji #${id}`}
      className="w-full h-full object-cover relative z-10"
      loading="lazy"
      data-gateway-index="0"
      onError={(e) =>
        handleImageError(e, id, parseInt((e.target as HTMLImageElement).dataset.gatewayIndex || '0'))
      }
    />
    <div className="absolute inset-0 bg-ohnahji-black/40 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-white font-black text-sm font-sans">#{id}</span>
    </div>
  </motion.div>
)

const NFTGalleryGrid = ({ tokens, heroTokenId, onSelectToken }: NFTGalleryGridProps) => {
  const isMobile = useIsMobile()

  // Mobile: plain scrollable 3-col grid — zoom/pan canvas is unusable on touch
  if (isMobile) {
    return (
      <div className="w-full h-full overflow-y-auto pb-8 px-4">
        <div className="grid grid-cols-3 gap-1">
          {tokens.map((id) => (
            <NFTCard key={id} id={id} heroTokenId={heroTokenId} onSelectToken={onSelectToken} />
          ))}
        </div>
      </div>
    )
  }

  // Desktop: pan + zoom canvas
  return (
    <TransformWrapper initialScale={1.5} minScale={0.5} maxScale={4} centerOnInit limitToBounds={false}>
      <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
        <div
          className="grid gap-[6px] p-40"
          style={{ gridTemplateColumns: 'repeat(12, 1fr)', width: 'fit-content', margin: 'auto' }}
        >
          {tokens.map((id) => (
            <NFTCard key={id} id={id} heroTokenId={heroTokenId} onSelectToken={onSelectToken} />
          ))}
        </div>
      </TransformComponent>
    </TransformWrapper>
  )
}

export default NFTGalleryGrid
