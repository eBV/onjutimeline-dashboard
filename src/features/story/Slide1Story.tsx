import { motion } from 'framer-motion'

const beats = [
  {
    icon: '🎨',
    label: 'Origins',
    heading: 'A Cultural Art PFP',
    body: 'Ohnahji launched as a profile picture collection rooted in Black and Brown culture — art that looked like us, made for us.',
    accent: '#FE517E',
  },
  {
    icon: '🤝',
    label: 'Community',
    heading: 'A Safe Space',
    body: 'The community grew into something deeper: a welcoming home for Black, Brown, and Allied people to explore emerging technologies together without fear of judgment.',
    accent: '#F1C40F',
  },
  {
    icon: '💡',
    label: 'Education',
    heading: 'Learning & Building',
    body: 'From NFTs and DeFi to AI and beyond — we made Web3 accessible, approachable, and grounded in real community.',
    accent: '#FE517E',
  },
  {
    icon: '🏛️',
    label: 'Identity',
    heading: "Web3's First HBCU",
    body: 'The community gave us the name. We carry it with pride.',
    accent: '#F1C40F',
    highlight: true,
  },
]

const Slide1Story = () => {
  return (
    <div className="min-h-full flex flex-col justify-center py-8 gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="dash-badge mb-3">Our Story</span>
        <h1 className="text-4xl md:text-6xl font-black text-white leading-none">
          How We<br />Got Here
        </h1>
      </motion.div>

      {/* Scroll affordance: below lg the four chapters stack and the last
          one sits below the fold of the slide's inner scroller, which
          previously gave no hint that more content was there. */}
      <div className="lg:hidden flex items-center gap-2 -mt-2" aria-hidden="true">
        <motion.span
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-ohnahji-gold text-xs"
        >
          ↓
        </motion.span>
        <span className="text-[11px] text-dash-muted font-medium tracking-widest uppercase">
          Scroll for all four chapters
        </span>
      </div>

      {/* Story cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4">
        {beats.map((beat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-xl p-4 md:p-5 flex flex-col gap-3"
            style={beat.highlight
              ? { background: '#141200', border: `1px solid rgba(241,196,15,0.3)` }
              : { background: '#161616', border: '1px solid #2a2a2a' }
            }
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <span className="text-2xl">{beat.icon}</span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: beat.accent, background: `${beat.accent}18`, border: `1px solid ${beat.accent}30` }}
              >
                {beat.label}
              </span>
            </div>
            {/* Content */}
            <div>
              <h3
                className="font-black text-base md:text-lg leading-snug mb-2"
                style={{ color: beat.accent }}
              >
                {beat.heading}
              </h3>
              <p className="text-dash-muted text-sm leading-relaxed">
                {beat.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex justify-between items-center text-[11px] text-dash-muted pt-1 border-t"
        style={{ borderColor: '#2a2a2a' }}
      >
        <span>Built for ohnahji</span>
        <span>Est. January 2022</span>
      </div>
    </div>
  )
}

export default Slide1Story
