import { motion } from 'framer-motion'
import { Twitter, Instagram, MessageCircle, Youtube, Twitch, AtSign, Sprout } from 'lucide-react'
import { CONTRACT_ADDRESS } from '../../lib/constants'

// Official links only. Discord leads (it is the community home); the big
// Discord CTA block that used to sit under the grid is gone by design, the
// card is the invite. Farcaster was removed; Kick and Reddit joined, and
// Threads and Lens cards complete the verified set.
const Slide6Socials = () => {
  const socials: {
    name: string
    link: string
    icon: React.ReactNode
    color: string
    textClass?: string
  }[] = [
    { name: 'Discord', link: 'https://discord.com/invite/3ahyqHkhc7', icon: <MessageCircle size={30} />, color: 'bg-[#5865F2]' },
    { name: 'Twitter', link: 'https://x.com/ohnahji', icon: <Twitter size={30} />, color: 'bg-[#000000]' },
    { name: 'Instagram', link: 'https://instagram.com/ohnahji', icon: <Instagram size={30} />, color: 'bg-[#E1306C]' },
    { name: 'Threads', link: 'https://www.threads.net/@ohnahji', icon: <AtSign size={30} />, color: 'bg-[#111111]' },
    { name: 'YouTube', link: 'https://youtube.com/@ohnahji', icon: <Youtube size={30} />, color: 'bg-[#FF0000]' },
    { name: 'Twitch', link: 'https://twitch.tv/ohnahji', icon: <Twitch size={30} />, color: 'bg-[#9146FF]' },
    { name: 'Kick', link: 'https://kick.com/ohnahji', icon: <span className="text-[28px] leading-none font-black">K</span>, color: 'bg-[#53FC18]', textClass: 'text-ohnahji-black' },
    { name: 'Reddit', link: 'https://www.reddit.com/r/Ohnahji/', icon: <span className="text-[26px] leading-none font-black">r/</span>, color: 'bg-[#FF4500]' },
    { name: 'Lens', link: 'https://orb.club/@ohnahji', icon: <Sprout size={30} />, color: 'bg-[#ABFE2C]', textClass: 'text-ohnahji-black' },
    { name: 'OpenSea', link: 'https://opensea.io/collection/ohnahji', icon: <span className="text-[26px] leading-none">🌊</span>, color: 'bg-[#2081E2]' },
    { name: 'Etherscan', link: `https://etherscan.io/address/${CONTRACT_ADDRESS}`, icon: <span className="text-[26px] leading-none">🔍</span>, color: 'bg-[#21325E]' },
  ]

  return (
    <div className="min-h-full flex flex-col items-center justify-start md:justify-center pt-20 pb-8 md:py-8">
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="neo-card bg-ohnahji-white p-6 md:p-10 rounded-[3.5rem] relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-ohnahji-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 -z-0" />

          <div className="relative z-10 text-center mb-8 md:mb-10">
            <h2 className="text-5xl font-black text-ohnahji-burgundy mb-4">Join the community</h2>
            <p className="text-xl text-ohnahji-burgundy/70 max-w-xl mx-auto">
              Follow us across the web and stay updated on the latest in emerging tech.
            </p>
          </div>

          {/* Link cards fill the space the old Discord CTA block used:
              flex-wrap centres the short last row instead of stranding it. */}
          <div className="relative z-10 flex flex-wrap justify-center gap-3 md:gap-4">
            {socials.map((social, index) => (
              <motion.a
                key={social.name}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className={`${social.color} ${social.textClass ?? 'text-white'} w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.75rem)] lg:w-[calc(25%-0.75rem)] px-3 py-5 flex flex-col items-center justify-center gap-2 rounded-2xl border-[4px] border-ohnahji-black shadow-neo hover:shadow-neo-lg transition-all`}
              >
                <span className="h-[30px] flex items-center">{social.icon}</span>
                <span className="font-bold text-sm tracking-wide font-sans text-center leading-tight">{social.name}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Trust kit: anti-phishing line. Only official links live here. */}
        <p className="mt-6 text-center text-ohnahji-black font-bold text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto px-2">
          Ohnahji will never DM you first, ask for your seed phrase, or ask you to approve unknown contracts. Official links live only on this site.
        </p>
      </div>
    </div>
  )
}

export default Slide6Socials
