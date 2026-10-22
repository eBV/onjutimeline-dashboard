import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../hooks/useStore'

const StatCard = ({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub: string
  highlight?: boolean
}) => (
  <div
    className="flex flex-col gap-1 p-3 md:p-4 rounded-xl flex-1 min-w-0"
    style={highlight
      ? { background: '#1a0d12', border: '1px solid rgba(254,81,126,0.35)' }
      : { background: '#161616', border: '1px solid #2a2a2a' }
    }
  >
    <span className="dash-label truncate">{label}</span>
    <span className={`text-xl md:text-2xl font-black leading-none ${highlight ? 'text-ohnahji-pink' : 'text-white'}`}>
      {value}
    </span>
    <span className="text-[11px] text-dash-muted truncate">{sub}</span>
  </div>
)

const Slide0Hero = () => {
  const { totalSupply } = useStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-full flex flex-col justify-center py-8 gap-4 md:gap-5">
      {/* Profile header card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dash-card p-5 md:p-6"
      >
        <div className="flex items-center gap-4 md:gap-5">
          <img
            src="/ji.png"
            alt="Ohnahji"
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-contain flex-shrink-0"
            style={{ background: '#F1C40F' }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-black text-white leading-none mb-1">
              ohnahji
            </h1>
            <p className="text-dash-muted text-sm md:text-base">twitch.tv/ohnahji</p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 text-sm text-dash-muted">
            <span className="w-2 h-2 rounded-full bg-[#444] inline-block" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        </div>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="px-1"
      >
        <p className="text-2xl md:text-4xl font-black text-white leading-tight">
          Web3's First{' '}
          <span className="text-ohnahji-pink">HBCU</span>
        </p>
        <p className="text-dash-muted text-sm md:text-base mt-1">
          Your Homebase For Learning Emerging Technologies
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex gap-2 md:gap-3"
      >
        <StatCard label="Followers" value="490" sub="Total" />
        <StatCard label="NFTs Minted" value={totalSupply > 0 ? totalSupply.toLocaleString() : '8,888'} sub="Genesis" highlight />
        <StatCard label="Founded" value="2022" sub="January" />
        <StatCard label="Streams" value="175+" sub="All time" />
        <StatCard label="Status" value="HBCU" sub="Web3" />
      </motion.div>

      {/* Scroll hint; the toggle is a real control: clicking it advances
          to the next slide (Story), same as a dot click or ArrowRight. */}
      <motion.button
        type="button"
        onClick={() => navigate('/story')}
        aria-label="Scroll to explore: go to the Story slide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex items-center gap-3 px-1 w-fit cursor-pointer group"
      >
        <div className="w-8 h-5 rounded-full flex items-center px-1 transition-colors group-hover:border-ohnahji-pink/60" style={{ border: '1px solid #2a2a2a' }}>
          <motion.div
            animate={{ x: [0, 14, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-2 h-2 rounded-full bg-ohnahji-pink"
          />
        </div>
        <span className="text-xs text-dash-muted font-medium tracking-widest uppercase group-hover:text-white transition-colors">Scroll to Explore</span>
      </motion.button>

      {/* Footer line */}
      <div
        className="flex justify-between items-center text-[11px] text-dash-muted pt-2 border-t"
        style={{ borderColor: '#2a2a2a' }}
      >
        <span>Built for ohnahji</span>
        <span>Data refreshes every 60s</span>
      </div>
    </div>
  )
}

export default Slide0Hero
