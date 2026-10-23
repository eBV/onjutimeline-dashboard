import { motion } from 'framer-motion'

const Slide3HBCU = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-start md:justify-center pt-20 pb-8 md:py-8">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-6 md:gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-block bg-ohnahji-burgundy text-ohnahji-white px-6 py-2 border-[6px] border-ohnahji-black rounded-2xl">
            <span className="text-sm font-bold">FEBRUARY 2022</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-ohnahji-burgundy leading-none">
            The HBCU<br />pivot
          </h1>
          <p className="text-xl text-ohnahji-burgundy font-bold max-w-md">
            Education meets innovation. Building the future of creative communities.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="neo-card p-6 bg-ohnahji-white rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-indigo-600 border-[6px] border-ohnahji-black flex items-center justify-center rounded-2xl">
                <span className="text-3xl" role="img" aria-label="Graduation Cap">🎓</span>
              </div>
              <div>
                <h3 className="text-2xl font-black">Discord Campus</h3>
                <p className="text-sm font-bold">Virtual Learning Community</p>
              </div>
            </div>
            <a
              href="https://discord.com/invite/3ahyqHkhc7"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-indigo-600 text-white text-center border-[6px] border-ohnahji-black shadow-neo rounded-2xl font-black text-xl hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active transition-all font-sans"
            >
              JOIN DISCORD
            </a>
          </div>

          <div className="neo-card p-6 bg-ohnahji-white rounded-3xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-ohnahji-pink border-[6px] border-ohnahji-black flex items-center justify-center rounded-2xl">
                <span className="text-3xl" role="img" aria-label="Calendar">📅</span>
              </div>
              <div>
                <h3 className="text-2xl font-black">#ONJUSaturdays</h3>
                <p className="text-sm font-bold">Weekly Educational Sessions</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Slide3HBCU
