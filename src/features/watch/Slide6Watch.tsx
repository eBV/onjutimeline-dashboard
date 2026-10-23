import { motion } from 'framer-motion'

const Slide6Watch = () => {
  return (
    <div className="min-h-full flex flex-col justify-start pt-8 pb-4 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-4 md:mb-6"
      >
        <div className="inline-block bg-ohnahji-gold text-ohnahji-black px-4 py-1 border-[6px] border-ohnahji-black rounded-2xl mb-3 font-sans">
          <span className="text-xs font-bold uppercase tracking-wider">RECORDED SESSIONS</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-ohnahji-white leading-none mb-2">
          ONJU<br />Streams
        </h1>
        <p className="text-base text-ohnahji-gold font-bold font-sans">
          Watch past livestreams & sessions
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 min-h-0 rounded-3xl overflow-hidden border-[6px] border-ohnahji-black shadow-neo"
        style={{ minHeight: '240px' }}
      >
        <iframe
          src="https://www.youtube.com/embed/videoseries?list=UU2jADEyzHMKOA9KuywmKqDQ&rel=0"
          className="w-full h-full"
          style={{ border: 'none', minHeight: '240px' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="ONJU Streams"
        />
      </motion.div>

      <div className="mt-3 flex justify-center">
        <a
          href="https://www.youtube.com/@ohnahji/streams"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-ohnahji-gold text-ohnahji-black px-6 py-3 border-[6px] border-ohnahji-black rounded-2xl font-black text-sm shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all font-sans"
        >
          OPEN ON YOUTUBE ↗
        </a>
      </div>
    </div>
  )
}

export default Slide6Watch
