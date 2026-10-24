import { useSlideSettings } from '../../lib/siteConfig'
import { motion } from 'framer-motion'
import { IPFS_CID_OKOLOTO } from '../../lib/constants'
import ResilientImage from '../../components/ResilientImage'

const Slide4Collections = () => {
  const { copy, weight } = useSlideSettings('/art')
  const copyClass = weight ? ' slide-copy' : ''
  const artworks: {
    id: number
    title: string
    color: string
    image?: string
    ipfs?: { cid: string; path: string }
    link: string
  }[] = [
    {
      id: 1,
      title: 'Okoloto #001',
      color: 'from-purple-500 to-pink-500',
      ipfs: { cid: IPFS_CID_OKOLOTO, path: '640.jpg' },
      link: 'https://opensea.io/collection/okoloto',
    },
    {
      id: 2,
      title: 'Okoloto #002',
      color: 'from-blue-500 to-cyan-500',
      ipfs: { cid: IPFS_CID_OKOLOTO, path: '265.jpg' },
      link: 'https://opensea.io/collection/okoloto',
    },
    {
      id: 3,
      title: 'Elemnts #001',
      color: 'from-orange-500 to-yellow-500',
      image: 'https://arweave.net/PLfqR9j24VXlek1oNotBkYrrRH_IiQQKDjmrsvAEEQc',
      link: 'https://opensea.io/collection/elemntsbyohnahji',
    },
    {
      id: 4,
      title: 'Elemnts #002',
      color: 'from-green-500 to-emerald-500',
      image: 'https://arweave.net/G87rtS-Mt-erTUE3aZZVwTfQ2fO4USetBEz8SmARM_M',
      link: 'https://opensea.io/collection/elemntsbyohnahji',
    },
    {
      id: 5,
      title: 'Okoloto #003',
      color: 'from-red-500 to-pink-500',
      ipfs: { cid: IPFS_CID_OKOLOTO, path: '1737.jpg' },
      link: 'https://opensea.io/collection/okoloto',
    },
    {
      id: 6,
      title: 'Elemnts #003',
      color: 'from-indigo-500 to-purple-500',
      image: 'https://arweave.net/8obmakSPrhbjzUwImpC9MKBXamQ7uFvSKCe-bU8W0MA',
      link: 'https://opensea.io/collection/elemntsbyohnahji',
    },
  ]

  return (
    <div className="min-h-full flex flex-col items-center justify-start md:justify-center pt-20 pb-8 md:py-4 lg:py-2">
      <div className="max-w-5xl w-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-3 md:mb-5 lg:mb-3"
        >
          <div className="inline-block bg-ohnahji-pink text-ohnahji-white px-4 py-1 border-[6px] border-ohnahji-black rounded-2xl mb-3 lg:mb-2 font-sans">
            <span className="text-xs font-bold uppercase tracking-wider">GENERATIVE ART</span>
          </div>
          <h1 className={`text-4xl md:text-5xl lg:text-4xl font-black text-ohnahji-gold mb-2 lg:mb-1 leading-none${copyClass}`}>
            {copy.heading}
          </h1>
          <p className={`text-base lg:text-sm text-ohnahji-white font-bold font-sans${copyClass}`}>
            {copy.paragraph}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-3 md:gap-3">
          {artworks.map((art, index) => (
            <motion.a
              key={art.id}
              href={art.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, zIndex: 10 }}
              className={`neo-card p-2 bg-gradient-to-br ${art.color} rounded-2xl cursor-pointer group flex flex-col gap-2`}
            >
              <div className="w-full aspect-square lg:aspect-auto lg:h-[23vh] border-4 border-ohnahji-black rounded-xl overflow-hidden bg-white/20">
                {art.ipfs ? (
                  <ResilientImage
                    cid={art.ipfs.cid}
                    path={art.ipfs.path}
                    alt={art.title}
                    loading="lazy"
                    placeholderText={art.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={art.image}
                    alt={art.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="bg-ohnahji-white border-4 border-ohnahji-black px-3 py-2 lg:py-1.5 rounded-lg shadow-neo-sm group-hover:shadow-neo transition-all">
                <p className="font-black font-sans uppercase text-sm md:text-[11px] tracking-tighter text-center">{art.title}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Slide4Collections
