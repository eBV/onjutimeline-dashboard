import { motion } from 'framer-motion'

const STORE_URL = 'https://ohnahji.creator-spring.com/'

// Featured picks from the Ohnahji U Campus Shop on Creator Spring.
// Fetched from the live storefront on 2026-10-22; names, prices, images and
// product URLs are the store's own. Edit this list to change the picks.
const FEATURED_ITEMS = [
  {
    name: 'Ohnahji Kanji',
    variant: 'Unisex Premium Pullover Hoodie',
    price: '$44.00',
    image: 'https://mockup-api.teespring.com/v3/image/5TG_1KzaNwx1GU2bg-tQ72b4zY0/800/800.jpg',
    url: 'https://ohnahji.creator-spring.com/listing/ohnahji-kanji?product=227',
  },
  {
    name: 'Ohnahji Stacked',
    variant: 'Classic Crew Neck T-Shirt',
    price: '$30.00',
    image: 'https://mockup-api.teespring.com/v3/image/UK0HNy9RaLc0xSLT6AFUoPA0FL0/800/800.jpg',
    url: 'https://ohnahji.creator-spring.com/listing/ohnahji-stacked?product=2',
  },
  {
    name: 'OHNAHJI Alphites Collegiate Hoodie',
    variant: 'Unisex Premium Pullover Hoodie',
    price: '$44.00',
    image: 'https://mockup-api.teespring.com/v3/image/KfF5gt3VXD4Kz9O12FGFI446G2Y/800/800.jpg',
    url: 'https://ohnahji.creator-spring.com/listing/ohnahji-alphites-collegiate?product=227',
  },
  {
    name: 'Ohnahji Kanji',
    variant: 'Classic Crew Neck T-Shirt',
    price: '$30.00',
    image: 'https://mockup-api.teespring.com/v3/image/b-pwHVHD6nWn6y6UuqmRyxM5NZQ/800/800.jpg',
    url: 'https://ohnahji.creator-spring.com/listing/ohnahji-kanji?product=2',
  },
]

const SlideMerch = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-start pt-20 pb-8 md:py-8">
      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8"
        >
          <div className="inline-block bg-ohnahji-burgundy text-ohnahji-white px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl mb-6">
            <span className="text-sm font-bold">OFFICIAL MERCH</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-ohnahji-burgundy mb-4">
            Campus Shop
          </h1>
          <p className="text-xl text-ohnahji-burgundy/70 font-bold max-w-2xl mx-auto">
            Rep the first Web3 HBCU. Official Ohnahji U gear from the Campus Shop on Creator Spring.
          </p>
          <a
            href={STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 bg-ohnahji-pink text-ohnahji-white px-8 py-4 border-[6px] border-ohnahji-black rounded-full font-black text-lg shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all"
          >
            SHOP MERCH ↗
          </a>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_ITEMS.map((item, i) => (
            <motion.a
              key={`${item.url}-${item.variant}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="neo-card bg-ohnahji-white rounded-3xl overflow-hidden flex flex-col hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all"
            >
              <div className="aspect-square bg-ohnahji-gold/20 border-b-[6px] border-ohnahji-black overflow-hidden">
                <img
                  src={item.image}
                  alt={`${item.name}; ${item.variant}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex flex-col gap-1 flex-1">
                <h3 className="font-black text-ohnahji-burgundy leading-tight">{item.name}</h3>
                <p className="text-xs font-bold text-ohnahji-burgundy/60">{item.variant}</p>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="font-black text-lg text-ohnahji-black">{item.price}</span>
                  <span className="text-xs font-black text-ohnahji-pink">SHOP ↗</span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SlideMerch
