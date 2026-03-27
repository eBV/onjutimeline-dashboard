import { motion } from 'framer-motion'
import { Twitter, Instagram, MessageCircle, Youtube, Twitch } from 'lucide-react'
import { CONTRACT_ADDRESS } from '../../lib/constants'

const web2Socials = [
  { name: 'Discord', link: 'https://discord.com/invite/3ahyqHkhc7', icon: <MessageCircle size={20} />, color: '#5865F2' },
  { name: 'Twitter', link: 'https://twitter.com/ohnahji', icon: <Twitter size={20} />, color: '#1DA1F2' },
  { name: 'Instagram', link: 'https://instagram.com/ohnahji', icon: <Instagram size={20} />, color: '#E1306C' },
  { name: 'YouTube', link: 'https://youtube.com/@ohnahji', icon: <Youtube size={20} />, color: '#FF0000' },
  { name: 'Twitch', link: 'https://twitch.tv/ohnahji', icon: <Twitch size={20} />, color: '#9146FF' },
  { name: 'Farcaster', link: 'https://farcaster.xyz/ohnahji', icon: <span className="text-base font-black">⬡</span>, color: '#8A63D2' },
  { name: 'OpenSea', link: 'https://opensea.io/collection/ohnahji', icon: <span className="text-base">🌊</span>, color: '#2081E2' },
  { name: 'Etherscan', link: `https://etherscan.io/address/${CONTRACT_ADDRESS}`, icon: <span className="text-base">🔍</span>, color: '#21325E' },
]

const milestones = [
  { label: '100 Followers', reached: true },
  { label: '250 Followers', reached: true },
  { label: '500 Followers', reached: false },
  { label: '1K Followers', reached: false },
  { label: '2.5K Followers', reached: false },
  { label: '5K Followers', reached: false },
]

const Slide6Socials = () => {
  const followerCount = 490
  const nextMilestone = 500
  const progress = (followerCount / nextMilestone) * 100

  return (
    <div className="min-h-full flex flex-col justify-center py-8 gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="dash-badge mb-3">Community</span>
        <h1 className="text-3xl md:text-5xl font-black text-white leading-none mt-3">
          Join the Community
        </h1>
        <p className="text-dash-muted text-sm mt-2">Follow us across the web and stay updated.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        {/* Socials grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-4 gap-2">
            {web2Socials.map((social, index) => (
              <motion.a
                key={social.name}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="rounded-xl p-3 flex flex-col items-center gap-2 group transition-all"
                style={{
                  background: '#161616',
                  border: '1px solid #2a2a2a',
                  color: social.color,
                }}
              >
                <span style={{ color: social.color }}>{social.icon}</span>
                <span className="text-[10px] font-semibold text-dash-muted text-center leading-tight group-hover:text-white transition-colors">
                  {social.name}
                </span>
              </motion.a>
            ))}
          </div>

          {/* CTA card */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: '#161616', border: '1px solid #2a2a2a' }}
          >
            <div>
              <div className="text-white font-bold">Become a member</div>
              <div className="text-dash-muted text-xs mt-0.5">Exclusive access to community &amp; events.</div>
            </div>
            <a
              href="https://discord.com/invite/3ahyqHkhc7"
              target="_blank"
              rel="noopener noreferrer"
              className="dash-btn w-full py-2.5 rounded-lg text-sm font-bold"
            >
              Join Discord →
            </a>
          </div>
        </motion.div>

        {/* Milestones panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-xl p-4 flex flex-col gap-4"
          style={{ background: '#141200', border: '1px solid rgba(241,196,15,0.25)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🏆</span>
            <span className="text-white font-bold">Milestones</span>
          </div>

          {/* Progress to 500 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-dash-muted">250</span>
              <span className="text-white font-bold">500 followers</span>
            </div>
            <div className="dash-progress-track">
              <div
                className="dash-progress-fill-gold transition-all duration-1000"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="text-dash-muted text-xs">{followerCount} / {nextMilestone}</div>
          </div>

          {/* Milestone checklist */}
          <div className="flex flex-col gap-2">
            {milestones.map((m) => (
              <div key={m.label} className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                  style={m.reached
                    ? { background: '#F1C40F', border: '1px solid #F1C40F' }
                    : { background: 'transparent', border: '1px solid #3a3a3a' }
                  }
                >
                  {m.reached && (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-sm"
                  style={{ color: m.reached ? '#F1C40F' : '#888' }}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div
        className="flex justify-between items-center text-[11px] text-dash-muted pt-1 border-t"
        style={{ borderColor: '#2a2a2a' }}
      >
        <span>Built for ohnahji</span>
        <span>Data refreshes every 60s</span>
      </div>
    </div>
  )
}

export default Slide6Socials
