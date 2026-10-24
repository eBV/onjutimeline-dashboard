import { motion } from 'framer-motion'

// First Look: a holder-only preview room for the two three.js builds in
// progress. Both are embedded same-page; each panel also carries an
// open-full-screen link for the real experience (the stadium is a
// full-screen build by design, and the campus walk mode wants the keys).

const STADIUM_URL = 'https://alphite-stadium.vercel.app/'
// The campus build (Four Corners in Dakar v8, the newest campus build;
// its walk-mode left/right reversal is fixed in the embedded copy) is
// served same-origin from public/firstlook/ so the embed never depends on
// a third-party host.
const CAMPUS_URL = '/firstlook/campus.html'

interface EmbedPanelProps {
  title: string
  blurb: string
  src: string
  frameTitle: string
  index: number
}

const EmbedPanel = ({ title, blurb, src, frameTitle, index }: EmbedPanelProps) => (
  <motion.section
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.15 + index * 0.12 }}
    className="neo-card bg-ohnahji-white rounded-3xl p-3 md:p-4 flex flex-col gap-3"
  >
    <div className="flex items-center justify-between gap-3 flex-wrap px-1">
      <div>
        <h2 className="font-black text-xl md:text-2xl text-ohnahji-burgundy leading-none">{title}</h2>
        <p className="font-bold text-xs md:text-sm text-ohnahji-burgundy/60 mt-1">{blurb}</p>
      </div>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-ohnahji-gold text-ohnahji-black text-xs font-black px-4 py-2 rounded-full border-[3px] border-ohnahji-black shadow-neo-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo transition-all"
      >
        OPEN FULL SCREEN ↗
      </a>
    </div>
    <div className="rounded-2xl overflow-hidden border-[4px] border-ohnahji-black bg-ohnahji-black">
      <iframe
        src={src}
        title={frameTitle}
        className="w-full aspect-video block"
        style={{ border: 'none' }}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    </div>
  </motion.section>
)

const SlideFirstLook = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-start pt-20 pb-8 md:py-8">
      <div className="max-w-5xl w-full flex flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <div className="inline-block bg-ohnahji-gold text-ohnahji-black px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl mb-5">
            <span className="text-sm font-bold">HOLDERS ONLY</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-ohnahji-white mb-3">
            First Look
          </h1>
          <p className="text-lg md:text-xl text-ohnahji-gold font-bold max-w-2xl mx-auto">
            Two worlds in the workshop, opened early for OG holders: the Alphites stadium and the new campus.
          </p>
        </motion.div>

        <EmbedPanel
          title="Alphites Stadium"
          blurb="The game-day build: one continuous stadium, no loading screens. WASD or drag to explore."
          src={STADIUM_URL}
          frameTitle="Alphites Stadium, three.js build"
          index={0}
        />
        <EmbedPanel
          title="Four Corners Campus: Dakar"
          blurb="The new campus in three.js. Hit Walk the campus for first and third person; V switches view."
          src={CAMPUS_URL}
          frameTitle="Four Corners Campus (Dakar build), three.js"
          index={1}
        />
      </div>
    </div>
  )
}

export default SlideFirstLook
