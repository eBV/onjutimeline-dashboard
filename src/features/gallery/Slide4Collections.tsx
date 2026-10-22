import { motion } from 'framer-motion'
import ResilientImage from '../../components/ResilientImage'
import { IPFS_CID_OKOLOTO } from '../../lib/constants'

interface Artwork {
  id: number
  title: string
  collection: string
  image?: string
  ipfs?: { cid: string; path: string }
  link: string
  accent: string
}

const artworks: Artwork[] = [
  {
    id: 1,
    title: 'Okoloto #001',
    collection: 'Okolotos',
    ipfs: { cid: IPFS_CID_OKOLOTO, path: '640.jpg' },
    link: 'https://opensea.io/collection/okoloto',
    accent: '#FE517E',
  },
  {
    id: 2,
    title: 'Okoloto #002',
    collection: 'Okolotos',
    ipfs: { cid: IPFS_CID_OKOLOTO, path: '265.jpg' },
    link: 'https://opensea.io/collection/okoloto',
    accent: '#FE517E',
  },
  {
    id: 3,
    title: 'Elemnts #001',
    collection: 'Elemnts',
    image: 'https://arweave.net/PLfqR9j24VXlek1oNotBkYrrRH_IiQQKDjmrsvAEEQc',
    link: 'https://opensea.io/collection/elemntsbyohnahji',
    accent: '#F1C40F',
  },
  {
    id: 4,
    title: 'Elemnts #002',
    collection: 'Elemnts',
    image: 'https://arweave.net/G87rtS-Mt-erTUE3aZZVwTfQ2fO4USetBEz8SmARM_M',
    link: 'https://opensea.io/collection/elemntsbyohnahji',
    accent: '#F1C40F',
  },
  {
    id: 5,
    title: 'Okoloto #003',
    collection: 'Okolotos',
    ipfs: { cid: IPFS_CID_OKOLOTO, path: '1737.jpg' },
    link: 'https://opensea.io/collection/okoloto',
    accent: '#FE517E',
  },
  {
    id: 6,
    title: 'Elemnts #003',
    collection: 'Elemnts',
    image: 'https://arweave.net/8obmakSPrhbjzUwImpC9MKBXamQ7uFvSKCe-bU8W0MA',
    link: 'https://opensea.io/collection/elemntsbyohnahji',
    accent: '#F1C40F',
  },
]

const Slide4Collections = () => {
  return (
    // pb-14: keeps the bottom-row card labels clear of the nav dots'
    // active tooltip, which projects 36px up from the pill below the
    // slide area when this slide's inner scroller is at the bottom.
    <div className="min-h-full flex flex-col justify-center pt-8 pb-14 gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between"
      >
        <div>
          <span className="dash-badge mb-3">Generative Art</span>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-none mt-3">
            Okolotos &amp; Elemnts
          </h1>
          <p className="text-dash-muted text-sm mt-2">Code-based artistic expression</p>
        </div>
        <div className="hidden md:flex gap-2">
          <span className="dash-badge">2 Collections</span>
          <span className="dash-badge-gold">On-chain</span>
        </div>
      </motion.div>

      {/* Art grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {artworks.map((art, index) => (
          <motion.a
            key={art.id}
            href={art.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
            className="rounded-xl overflow-hidden group cursor-pointer"
            style={{ background: '#161616', border: '1px solid #2a2a2a' }}
          >
            <div className="aspect-square overflow-hidden bg-[#0a0a0a]">
              {art.ipfs ? (
                <ResilientImage
                  cid={art.ipfs.cid}
                  path={art.ipfs.path}
                  alt={art.title}
                  loading="lazy"
                  placeholderText={art.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <img
                  src={art.image}
                  alt={art.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div
              className="px-3 py-2.5 flex items-center justify-between"
              style={{ borderTop: '1px solid #2a2a2a' }}
            >
              <div>
                <div className="text-white text-xs font-bold leading-none">{art.title}</div>
                <div className="text-dash-muted text-[10px] mt-0.5">{art.collection}</div>
              </div>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ color: art.accent, background: `${art.accent}15`, border: `1px solid ${art.accent}30` }}
              >
                ↗
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  )
}

export default Slide4Collections
