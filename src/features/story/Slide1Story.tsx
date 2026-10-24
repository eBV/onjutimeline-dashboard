import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { useSlideSettings, copyLines } from '../../lib/siteConfig'

const chapters = [
  {
    icon: '🎨',
    heading: 'A Cultural Art PFP',
    body: 'Ohnahji launched as a profile picture collection rooted in Black and Brown culture — art that looked like us, made for us.',
  },
  {
    icon: '🤝',
    heading: 'A Safe Space',
    body: 'The community grew into something deeper: a welcoming home for Black, Brown, and Allied people to explore emerging technologies together without fear of judgment.',
  },
  {
    icon: '💡',
    heading: 'Learning & Building',
    body: 'From NFTs and DeFi to AI and beyond — we made Web3 accessible, approachable, and grounded in real community.',
  },
  {
    icon: '🏛️',
    heading: "Web3's First HBCU",
    body: 'The community gave us the name. We carry it with pride.',
    highlight: true,
  },
]

const Slide1Story = () => {
  const { copy, weight } = useSlideSettings('/story')
  const copyClass = weight ? ' slide-copy' : ''
  return (
    <div className="min-h-full flex flex-col justify-start pt-16 pb-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mb-8"
      >
        <div className="inline-block bg-ohnahji-burgundy text-ohnahji-white px-5 py-1.5 border-[6px] border-ohnahji-black rounded-2xl mb-4">
          <span className="text-xs font-bold tracking-widest uppercase">Our Story</span>
        </div>
        <h1 className={`text-5xl md:text-7xl font-black text-ohnahji-black leading-none${copyClass}`}>
          {copyLines(copy.heading).map((line, i) => (
            <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>
          ))}
        </h1>
      </motion.div>

      {/* Scroll affordance: below lg the four chapters stack and the last
          one sits below the fold of the slide's inner scroller, which
          previously gave no hint that more content was there. */}
      <div className="lg:hidden flex items-center gap-2 -mt-4 mb-6" aria-hidden="true">
        <motion.span
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-ohnahji-burgundy text-xs"
        >
          ↓
        </motion.span>
        <span className="text-[11px] text-ohnahji-burgundy/80 font-semibold tracking-widest uppercase">
          Scroll for all four chapters
        </span>
      </div>

      {/* MoDDA proof point (2022): the collection's museum milestone. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl border-[6px] border-ohnahji-black p-4 md:p-5 mb-4 lg:mb-5 bg-ohnahji-black shadow-neo flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <span className="text-3xl shrink-0">🏆</span>
        <div className="flex-1">
          <h3 className="font-black text-lg leading-tight mb-1 text-ohnahji-gold">
            Proof of Culture · 2022
          </h3>
          <p className={`font-bold text-sm leading-relaxed text-ohnahji-white${copyClass}`}>
            {copy.paragraph}
          </p>
        </div>
        <a
          href="https://modda.org/proof-of-culture"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-ohnahji-gold text-ohnahji-black px-4 py-2 border-[4px] border-ohnahji-gold rounded-full font-black text-xs hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-center"
        >
          VIEW AT MoDDA ↗
        </a>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-5">
        {chapters.map((chapter, i) => (
          <motion.div
            key={chapter.heading}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`rounded-2xl border-[6px] border-ohnahji-black p-4 md:p-5 flex gap-4 items-start shadow-neo transform-gpu ${i % 2 === 0 ? 'bg-ohnahji-burgundy' : 'bg-ohnahji-pink'}`}
          >
            <span className="text-3xl shrink-0 mt-0.5">{chapter.icon}</span>
            <div>
              <h3 className="font-black text-lg leading-tight mb-1 text-ohnahji-gold">
                {chapter.heading}
              </h3>
              <p className="font-bold text-sm leading-relaxed text-ohnahji-white">
                {chapter.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Slide1Story
