import { useSlideSettings } from '../../lib/siteConfig'
import { motion } from 'framer-motion'

// Exchangent: the New Eden explainer, vendored same-origin under
// public/exchangent/ and shown in an iframe. The slide itself is
// OG-gated (see src/lib/deck.ts); the vendored files are public
// static assets, so gating hides navigation, not the files, exactly
// like Vault and First Look. The frame fills the slide and scrolls
// internally; the open-full-screen link gives the real experience.

const EXCHANGENT_URL = '/exchangent/index.html'

const SlideExchangent = () => {
  const { copy, weight } = useSlideSettings('/exchangent')
  const copyClass = weight ? ' slide-copy' : ''
  return (
    <div className="min-h-full flex flex-col items-center justify-start pt-20 pb-8 md:py-8">
      <div className="max-w-5xl w-full flex flex-col gap-5 flex-1">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <div className="inline-block bg-ohnahji-gold text-ohnahji-black px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl mb-5">
            <span className="text-sm font-bold">HOLDERS ONLY</span>
          </div>
          <h1 className={`text-5xl md:text-7xl font-black text-ohnahji-white mb-3${copyClass}`}>
            {copy.heading}
          </h1>
          <p className={`text-lg md:text-xl text-ohnahji-gold font-bold max-w-2xl mx-auto${copyClass}`}>
            {copy.paragraph}
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="neo-card bg-ohnahji-white rounded-3xl p-3 md:p-4 flex flex-col gap-3 flex-1"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap px-1">
            <div>
              <h2 className="font-black text-xl md:text-2xl text-ohnahji-burgundy leading-none">The Exchangent Explainer</h2>
              <p className="font-bold text-xs md:text-sm text-ohnahji-burgundy/60 mt-1">
                The marketplace, the Gallery, the Welcome House, and the Archive, in one scroll.
              </p>
            </div>
            <a
              href={EXCHANGENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-ohnahji-gold text-ohnahji-black text-xs font-black px-4 py-2 rounded-full border-[3px] border-ohnahji-black shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo transition-all"
            >
              OPEN FULL SCREEN ↗
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden border-[4px] border-ohnahji-black bg-ohnahji-black flex-1 min-h-[70dvh]">
            <iframe
              src={EXCHANGENT_URL}
              title="The Exchangent Explainer"
              className="w-full h-full min-h-[70dvh] block"
              style={{ border: 'none' }}
              allow="fullscreen"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default SlideExchangent
